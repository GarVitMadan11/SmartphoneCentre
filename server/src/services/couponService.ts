import prisma from '../db.js';

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  code?: string;
  type?: 'FLAT' | 'PERCENT';
  value?: number;
  bonusAmount?: number;
  finalPrice?: number;
}

/**
 * Validates a referral / promotional coupon code against business rules,
 * expiry dates, maximum overall redemptions, per-user limits, and minimum device value.
 */
export async function validateCoupon(
  rawCode: string,
  basePrice: number,
  customerPhone?: string,
  customerEmail?: string
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
    }
  }

  if (!coupon || !coupon.active) {
    return { valid: false, message: 'Referral code not found or inactive.' };
  }

  // Check expiration date
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: 'This referral code has expired.' };
  }

  // Check total usage cap (0 = unlimited)
  if (coupon.maxTotalUses > 0 && coupon.currentUses >= coupon.maxTotalUses) {
    return { valid: false, message: 'This referral code has reached its maximum redemption limit.' };
  }

  // Check minimum device valuation requirement
  if (coupon.minDeviceValue > 0 && basePrice < coupon.minDeviceValue) {
    return {
      valid: false,
      message: `Minimum device value of ₹${coupon.minDeviceValue.toLocaleString('en-IN')} required for code ${coupon.code}.`,
    };
  }

  // Check per-user redemption limit if phone or email is known
  const cleanPhone = (customerPhone || '').trim();
  const cleanEmail = (customerEmail || '').trim().toLowerCase();
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

  // Compute bonus addition
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
 * Records coupon redemption upon confirmed booking submission or quote lock.
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

  return true;
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
  type?: 'FLAT' | 'PERCENT';
  value: number;
  minDeviceValue?: number;
  maxBonusCap?: number;
  maxTotalUses?: number;
  maxUsesPerUser?: number;
  expiresAt?: string | null;
  createdBy?: string;
}) {
  const code = data.code.trim().toUpperCase();
  return (prisma as any).referralCoupon.create({
    data: {
      code,
      type: data.type || 'FLAT',
      value: Number(data.value),
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
      minDeviceValue: true,
      maxBonusCap: true,
      expiresAt: true,
    },
    orderBy: { value: 'desc' },
    take: 6,
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
      code: 'RPX500',
      type: 'FLAT' as const,
      value: 500,
      minDeviceValue: 30000,
      description: 'Flat ₹500 extra cash for devices valued ₹30,000+',
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
  const formattedDb = dbCoupons.map((c: any) => ({
    code: c.code,
    type: c.type,
    value: c.value,
    minDeviceValue: c.minDeviceValue || 0,
    maxBonusCap: c.maxBonusCap || null,
    description: c.type === 'PERCENT'
      ? `+${c.value}% extra payout bonus${c.maxBonusCap ? ` (up to ₹${c.maxBonusCap})` : ''}`
      : `Flat ₹${c.value.toLocaleString('en-IN')} extra payout added to your doorside transfer`,
  }));

  const merged = [
    ...formattedDb,
    ...defaults.filter(d => !existingCodes.has(d.code)),
  ];

  return merged;
}

