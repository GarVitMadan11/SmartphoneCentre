import prisma from '../db.js';

export interface CouponTier {
  min: number;
  bonus: number;
}

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  code?: string;
  type?: 'FLAT' | 'PERCENT' | 'TIERED';
  value?: number;
  bonusAmount?: number;
  finalPrice?: number;
  tierInfo?: {
    currentBonus: number;
    nextTier?: {
      minValuation: number;
      bonus: number;
      amountNeeded: number;
    };
  };
}

/**
 * Validates a referral / promotional coupon code against business rules,
 * expiry dates, maximum overall redemptions, per-user limits, brand filters,
 * first-time seller restrictions, self-referral checks, and tiered bonus rules.
 */
export async function validateCoupon(
  rawCode: string,
  basePrice: number,
  customerPhone?: string,
  customerEmail?: string,
  brandName?: string,
  userId?: string
): Promise<CouponValidationResult> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Please provide a valid referral code.' };
  }

  if (typeof basePrice !== 'number' || basePrice <= 0) {
    return { valid: false, message: 'Invalid device valuation base price.' };
  }

  let coupon = await (prisma as any).referralCoupon.findUnique({
    where: { code },
  });

  // Seed default promo codes if not yet populated
  if (!coupon) {
    if (code === 'WELCOME300') {
      try {
        coupon = await (prisma as any).referralCoupon.create({
          data: {
            code: 'WELCOME300',
            type: 'FLAT',
            value: 300,
            minDeviceValue: 5000,
            maxTotalUses: 10000,
            maxUsesPerUser: 1,
            active: true,
            createdBy: 'SYSTEM',
          },
        });
      } catch {
        coupon = await (prisma as any).referralCoupon.findUnique({ where: { code } });
      }
    } else if (code === 'REPHONIX3') {
      try {
        coupon = await (prisma as any).referralCoupon.create({
          data: {
            code: 'REPHONIX3',
            type: 'PERCENT',
            value: 3,
            minDeviceValue: 10000,
            maxBonusCap: 1500,
            maxTotalUses: 10000,
            maxUsesPerUser: 1,
            active: true,
            createdBy: 'SYSTEM',
          },
        });
      } catch {
        coupon = await (prisma as any).referralCoupon.findUnique({ where: { code } });
      }
    } else if (code === 'SUPERTIER') {
      try {
        coupon = await (prisma as any).referralCoupon.create({
          data: {
            code: 'SUPERTIER',
            type: 'TIERED',
            value: 300,
            tierRules: JSON.stringify([
              { min: 5000, bonus: 300 },
              { min: 20000, bonus: 700 },
              { min: 40000, bonus: 1500 },
            ]),
            minDeviceValue: 5000,
            maxTotalUses: 10000,
            maxUsesPerUser: 1,
            active: true,
            createdBy: 'SYSTEM',
          },
        });
      } catch {
        coupon = await (prisma as any).referralCoupon.findUnique({ where: { code } });
      }
    }
  }

  if (!coupon || !coupon.active) {
    return { valid: false, message: 'Referral code not found or inactive.' };
  }

  // 1. Check expiration date
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: 'This referral code has expired.' };
  }

  // 2. Check total usage cap (0 = unlimited)
  if (coupon.maxTotalUses > 0 && coupon.currentUses >= coupon.maxTotalUses) {
    return { valid: false, message: 'This referral code has reached its maximum redemption limit.' };
  }

  const cleanPhone = (customerPhone || '').trim();
  const cleanEmail = (customerEmail || '').trim().toLowerCase();

  // 3. Self-referral prevention for customer referral codes
  if (coupon.isCustomerRef && coupon.referrerUserId) {
    if (userId && userId === coupon.referrerUserId) {
      return { valid: false, message: 'You cannot redeem your own personal referral code.' };
    }
    const referrer = await (prisma as any).user.findUnique({
      where: { id: coupon.referrerUserId },
    });
    if (referrer) {
      if (cleanEmail && referrer.email && referrer.email.toLowerCase() === cleanEmail) {
        return { valid: false, message: 'You cannot redeem your own personal referral code.' };
      }
      if (cleanPhone && referrer.phone && referrer.phone.trim() === cleanPhone) {
        return { valid: false, message: 'You cannot redeem your own personal referral code.' };
      }
    }
  }

  // 4. Target Brands restriction check
  if (coupon.targetBrands) {
    try {
      const allowedBrands: string[] = typeof coupon.targetBrands === 'string'
        ? JSON.parse(coupon.targetBrands)
        : coupon.targetBrands;
      if (Array.isArray(allowedBrands) && allowedBrands.length > 0) {
        if (brandName) {
          const isBrandAllowed = allowedBrands.some((b: string) =>
            brandName.toLowerCase().includes(b.toLowerCase()) ||
            b.toLowerCase().includes(brandName.toLowerCase())
          );
          if (!isBrandAllowed) {
            return {
              valid: false,
              message: `Code ${coupon.code} is valid exclusively for ${allowedBrands.join(', ')} devices.`,
            };
          }
        }
      }
    } catch {
      // ignore parse error, allow through
    }
  }

  // 5. First-time seller restriction check
  if (coupon.firstTimeOnly) {
    const filters: any[] = [];
    if (cleanPhone) filters.push({ customerPhone: cleanPhone });
    if (cleanEmail) filters.push({ customerEmail: cleanEmail });
    if (filters.length > 0) {
      const pastBookings = await (prisma as any).booking.count({
        where: { OR: filters },
      });
      if (pastBookings > 0) {
        return {
          valid: false,
          message: 'This promo is exclusively for your first device sale on Rephonix.',
        };
      }
    }
  }

  // 6. Minimum device valuation requirement
  if (coupon.minDeviceValue > 0 && basePrice < coupon.minDeviceValue) {
    return {
      valid: false,
      message: `Minimum device value of ₹${coupon.minDeviceValue.toLocaleString('en-IN')} required for code ${coupon.code}.`,
    };
  }

  // 7. Check per-user redemption limit if phone or email is known
  if (cleanPhone || cleanEmail) {
    const filters: any[] = [];
    if (cleanPhone) filters.push({ customerPhone: cleanPhone });
    if (cleanEmail) filters.push({ customerEmail: cleanEmail });

    const priorUses = await (prisma as any).couponUsage.count({
      where: {
        couponId: coupon.id,
        OR: filters,
      },
    });

    if (priorUses >= coupon.maxUsesPerUser) {
      return { valid: false, message: 'You have already redeemed this referral code.' };
    }
  }

  // 8. Compute bonus addition based on type
  if (coupon.type === 'TIERED') {
    let tiers: CouponTier[] = [];
    try {
      tiers = typeof coupon.tierRules === 'string' ? JSON.parse(coupon.tierRules) : coupon.tierRules;
    } catch {
      tiers = [];
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      const bonusAmount = Math.round(coupon.value || 300);
      return {
        valid: true,
        code: coupon.code,
        type: 'TIERED',
        value: bonusAmount,
        bonusAmount,
        finalPrice: basePrice + bonusAmount,
        message: `+₹${bonusAmount.toLocaleString('en-IN')} Bonus applied!`,
      };
    }

    tiers.sort((a, b) => a.min - b.min);
    const eligibleTiers = tiers.filter((t) => basePrice >= t.min);

    if (eligibleTiers.length === 0) {
      return {
        valid: false,
        message: `Device valuation of at least ₹${tiers[0].min.toLocaleString('en-IN')} required for tiered promo ${coupon.code}.`,
      };
    }

    const currentTier = eligibleTiers[eligibleTiers.length - 1];
    const bonusAmount = currentTier.bonus;
    const higherTier = tiers.find((t) => t.min > basePrice);

    let tierInfo: any = { currentBonus: bonusAmount };
    if (higherTier) {
      tierInfo.nextTier = {
        minValuation: higherTier.min,
        bonus: higherTier.bonus,
        amountNeeded: higherTier.min - basePrice,
      };
    }

    return {
      valid: true,
      code: coupon.code,
      type: 'TIERED',
      value: bonusAmount,
      bonusAmount,
      finalPrice: basePrice + bonusAmount,
      tierInfo,
      message: higherTier
        ? `+₹${bonusAmount.toLocaleString('en-IN')} Tier Bonus applied! (Valuation ₹${higherTier.min.toLocaleString('en-IN')}+ unlocks +₹${higherTier.bonus.toLocaleString('en-IN')})`
        : `+₹${bonusAmount.toLocaleString('en-IN')} Top-Tier Bonus applied!`,
    };
  }

  let bonusAmount = 0;
  if (coupon.type === 'PERCENT') {
    bonusAmount = Math.round((basePrice * coupon.value) / 100);
    if (coupon.maxBonusCap && coupon.maxBonusCap > 0 && bonusAmount > coupon.maxBonusCap) {
      bonusAmount = coupon.maxBonusCap;
    }
  } else {
    bonusAmount = Math.round(coupon.value);
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type as 'FLAT' | 'PERCENT',
    value: coupon.value,
    bonusAmount,
    finalPrice: basePrice + bonusAmount,
    message: coupon.type === 'PERCENT'
      ? `+${coupon.value}% Bonus applied! (Extra ₹${bonusAmount.toLocaleString('en-IN')})`
      : `+₹${bonusAmount.toLocaleString('en-IN')} Bonus applied!`,
  };
}

/**
 * Records coupon redemption upon confirmed booking submission.
 * Also generates a pending referral reward for the referrer if this was a customer referral code.
 */
export async function recordCouponUsage(params: {
  couponCode: string;
  basePrice: number;
  bonusCredited: number;
  finalPrice: number;
  bookingId?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
}): Promise<boolean> {
  const code = (params.couponCode || '').trim().toUpperCase();
  if (!code) return false;

  const coupon = await (prisma as any).referralCoupon.findUnique({
    where: { code },
  });

  if (!coupon) return false;

  await prisma.$transaction([
    (prisma as any).referralCoupon.update({
      where: { id: coupon.id },
      data: {
        currentUses: { increment: 1 },
      },
    }),
    (prisma as any).couponUsage.create({
      data: {
        couponId: coupon.id,
        couponCode: coupon.code,
        bookingId: params.bookingId || null,
        customerPhone: (params.customerPhone || '').trim(),
        customerEmail: (params.customerEmail || '').trim().toLowerCase(),
        customerName: (params.customerName || '').trim(),
        basePrice: Math.round(params.basePrice),
        bonusCredited: Math.round(params.bonusCredited),
        finalPrice: Math.round(params.finalPrice),
      },
    }),
  ]);

  // If this was a customer referral code, queue a reward for the referrer
  if (coupon.isCustomerRef && coupon.referrerUserId && params.bookingId) {
    try {
      await (prisma as any).referralReward.create({
        data: {
          referrerUserId: coupon.referrerUserId,
          referredPhone: (params.customerPhone || '').trim(),
          referredEmail: (params.customerEmail || '').trim().toLowerCase(),
          couponCode: coupon.code,
          bookingId: params.bookingId,
          rewardAmount: coupon.referrerReward > 0 ? coupon.referrerReward : 200,
          status: 'PENDING',
        },
      });
    } catch (err: any) {
      console.warn('[ReferralReward] Failed to log referral reward (might be duplicate):', err.message);
    }
  }

  return true;
}

/**
 * Customer Referral Loop: Gets or creates a personalized referral code for an authenticated user.
 */
export async function getOrCreateCustomerReferral(user: { id: string; name: string; email: string; phone?: string }) {
  const dbUser = await (prisma as any).user.findUnique({ where: { id: user.id } });
  if (!dbUser) throw new Error('User not found');

  let code = dbUser.referralCode;
  if (!code) {
    const rawName = (dbUser.name || 'VIP').split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'VIP';
    const rand = Math.floor(100 + Math.random() * 900);
    code = `REF-${rawName}-${rand}`;

    const existing = await (prisma as any).referralCoupon.findUnique({ where: { code } });
    if (existing) {
      code = `REF-${rawName}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await (prisma as any).user.update({
      where: { id: user.id },
      data: { referralCode: code },
    });

    try {
      await (prisma as any).referralCoupon.create({
        data: {
          code,
          type: 'FLAT',
          value: 300, // Friend receives +₹300 bonus
          minDeviceValue: 5000,
          maxTotalUses: 0,
          maxUsesPerUser: 1,
          isCustomerRef: true,
          referrerUserId: user.id,
          referrerReward: 200, // Referrer receives ₹200 cash reward
          active: true,
          createdBy: 'CUSTOMER_REFERRAL',
        },
      });
    } catch (createErr: any) {
      console.warn('[ReferralCoupon] Code created concurrently:', createErr.message);
    }
  }

  return code;
}

/**
 * Returns comprehensive referral metrics and history for an authenticated customer.
 */
export async function getCustomerReferralStats(userId: string) {
  const rewards = await (prisma as any).referralReward.findMany({
    where: { referrerUserId: userId },
    orderBy: { createdAt: 'desc' },
  });

  const totalInvited = rewards.length;
  const totalCompleted = rewards.filter((r: any) => r.status === 'PAID' || r.status === 'APPROVED').length;
  const pendingRewards = rewards
    .filter((r: any) => r.status === 'PENDING')
    .reduce((sum: number, r: any) => sum + (r.rewardAmount || 0), 0);
  const totalEarned = rewards
    .filter((r: any) => r.status === 'PAID' || r.status === 'APPROVED')
    .reduce((sum: number, r: any) => sum + (r.rewardAmount || 0), 0);

  return {
    totalInvited,
    totalCompleted,
    pendingRewards,
    totalEarned,
    rewards: rewards.map((r: any) => ({
      id: r.id,
      bookingId: r.bookingId,
      rewardAmount: r.rewardAmount,
      status: r.status,
      createdAt: r.createdAt,
      referredPhoneMasked: r.referredPhone ? `${r.referredPhone.slice(0, 3)}****${r.referredPhone.slice(-3)}` : 'Friend',
    })),
  };
}

/**
 * Admin helpers for managing referral codes and viewing usage audits.
 */
export async function listAllCoupons() {
  return (prisma as any).referralCoupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { usages: true },
      },
    },
  });
}

export async function createReferralCoupon(data: {
  code: string;
  type?: 'FLAT' | 'PERCENT' | 'TIERED';
  value: number;
  tierRules?: string;
  targetBrands?: string;
  firstTimeOnly?: boolean;
  minDeviceValue?: number;
  maxBonusCap?: number;
  maxTotalUses?: number;
  maxUsesPerUser?: number;
  referrerReward?: number;
  expiresAt?: string | null;
  createdBy?: string;
}) {
  const code = data.code.trim().toUpperCase();
  return (prisma as any).referralCoupon.create({
    data: {
      code,
      type: data.type || 'FLAT',
      value: Number(data.value),
      tierRules: data.tierRules || '[]',
      targetBrands: data.targetBrands || '[]',
      firstTimeOnly: Boolean(data.firstTimeOnly),
      referrerReward: Number(data.referrerReward) || 0,
      minDeviceValue: Number(data.minDeviceValue) || 0,
      maxBonusCap: data.maxBonusCap ? Number(data.maxBonusCap) : null,
      maxTotalUses: data.maxTotalUses !== undefined ? Number(data.maxTotalUses) : 100,
      maxUsesPerUser: data.maxUsesPerUser !== undefined ? Number(data.maxUsesPerUser) : 1,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdBy: data.createdBy || 'ADMIN',
      active: true,
    },
  });
}

export async function toggleCouponStatus(id: string, active?: boolean) {
  const existing = await (prisma as any).referralCoupon.findUnique({ where: { id } });
  if (!existing) throw new Error('Coupon not found');

  const newStatus = active !== undefined ? active : !existing.active;
  return (prisma as any).referralCoupon.update({
    where: { id },
    data: { active: newStatus },
  });
}

export async function deleteReferralCoupon(id: string) {
  return (prisma as any).referralCoupon.delete({ where: { id } });
}

export async function listCouponUsages(limit: number = 100) {
  return (prisma as any).couponUsage.findMany({
    take: limit,
    orderBy: { usedAt: 'desc' },
  });
}

export async function listAllReferralRewards(status?: string) {
  const where = status ? { status } : {};
  return (prisma as any).referralReward.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateReferralRewardStatus(
  id: string,
  newStatus: string,
  notes?: string,
  payoutUpiId?: string
) {
  const reward = await (prisma as any).referralReward.findUnique({ where: { id } });
  if (!reward) throw new Error('Referral reward record not found');

  const updated = await (prisma as any).referralReward.update({
    where: { id },
    data: {
      status: newStatus,
      notes: notes || reward.notes,
      payoutUpiId: payoutUpiId || reward.payoutUpiId,
      paidAt: newStatus === 'PAID' ? new Date() : reward.paidAt,
    },
  });

  if (newStatus === 'PAID' && reward.status !== 'PAID') {
    await (prisma as any).user.update({
      where: { id: reward.referrerUserId },
      data: { referralBonusEarned: { increment: reward.rewardAmount } },
    }).catch(() => {});
  }

  return updated;
}

/**
 * Returns active public promotional offers for the customer diagnostic tray.
 */
export async function listActivePublicCoupons() {
  const now = new Date();
  const dbCoupons = await (prisma as any).referralCoupon.findMany({
    where: {
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    select: {
      code: true,
      type: true,
      value: true,
      tierRules: true,
      targetBrands: true,
      minDeviceValue: true,
      maxBonusCap: true,
      expiresAt: true,
    },
    orderBy: { value: 'desc' },
    take: 8,
  });

  const defaults = [
    {
      code: 'WELCOME300',
      type: 'FLAT' as const,
      value: 300,
      minDeviceValue: 5000,
      description: 'Flat ₹300 bonus on your diagnostic valuation',
    },
    {
      code: 'SUPERTIER',
      type: 'TIERED' as const,
      value: 300,
      minDeviceValue: 5000,
      description: 'Dynamic Stepped Bonus: +₹300 (₹5k+), +₹700 (₹20k+), +₹1,500 (₹40k+)',
    },
    {
      code: 'REPHONIX3',
      type: 'PERCENT' as const,
      value: 3,
      minDeviceValue: 10000,
      maxBonusCap: 1500,
      description: '+3% extra payout bonus (up to ₹1,500 extra)',
    },
  ];

  if (!dbCoupons || dbCoupons.length === 0) {
    return defaults;
  }

  const existingCodes = new Set(dbCoupons.map((c: any) => c.code.toUpperCase()));
  const formattedDb = dbCoupons.map((c: any) => {
    let description = `Flat ₹${c.value.toLocaleString('en-IN')} extra payout added to your doorstep transfer`;
    if (c.type === 'PERCENT') {
      description = `+${c.value}% extra payout bonus${c.maxBonusCap ? ` (up to ₹${c.maxBonusCap})` : ''}`;
    } else if (c.type === 'TIERED') {
      try {
        const tiers = JSON.parse(c.tierRules || '[]');
        if (Array.isArray(tiers) && tiers.length > 0) {
          description = `Tiered Bonus: up to +₹${Math.max(...tiers.map((t: any) => t.bonus)).toLocaleString('en-IN')} extra`;
        }
      } catch {
        description = 'Stepped valuation bonus based on device worth';
      }
    }
    return {
      code: c.code,
      type: c.type,
      value: c.value,
      minDeviceValue: c.minDeviceValue || 0,
      maxBonusCap: c.maxBonusCap || null,
      description,
    };
  });

  return [
    ...formattedDb,
    ...defaults.filter((d) => !existingCodes.has(d.code)),
  ];
}
