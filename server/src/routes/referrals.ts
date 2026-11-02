import { Router, Response } from 'express';
import { customerAuth, AuthenticatedCustomerRequest } from '../middleware/customerAuth.js';
import { getOrCreateCustomerReferral, getCustomerReferralStats } from '../services/couponService.js';
import prisma from '../db.js';

const router = Router();

/**
 * GET /api/referrals/my-code
 * Retrieves or auto-creates the authenticated customer's unique referral code and tracking stats.
 */
router.get('/my-code', customerAuth, async (req: AuthenticatedCustomerRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'NotFound', message: 'User profile not found' });
      return;
    }

    const referralCode = await getOrCreateCustomerReferral(user);
    const stats = await getCustomerReferralStats(user.id);

    const protocol = req.protocol || 'https';
    const host = req.get('host') || 'rephonix.in';
    // Clean production domain for link sharing
    const cleanHost = host.includes('localhost') ? host : 'rephonix.in';
    const shareUrl = `${protocol}://${cleanHost}/sell?ref=${referralCode}`;

    res.json({
      success: true,
      referralCode,
      shareUrl,
      friendBonus: 300,
      referrerReward: 200,
      stats,
    });
  } catch (err: any) {
    console.error('GET /api/referrals/my-code error:', err);
    res.status(500).json({ error: 'ServerError', message: err.message || 'Failed to retrieve referral data' });
  }
});

/**
 * POST /api/referrals/payout-upi
 * Sets or updates the customer's UPI ID for referral reward payouts.
 */
router.post('/payout-upi', customerAuth, async (req: AuthenticatedCustomerRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { upiId } = req.body || {};
    if (!userId || !upiId || typeof upiId !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'A valid UPI ID is required.' });
      return;
    }

    const cleanUpi = upiId.trim();
    if (!cleanUpi.includes('@')) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid UPI format (e.g. mobile@okhdfcbank).' });
      return;
    }

    await (prisma as any).referralReward.updateMany({
      where: {
        referrerUserId: userId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      data: { payoutUpiId: cleanUpi },
    });

    res.json({ success: true, message: 'UPI ID updated successfully for referral payouts.' });
  } catch (err: any) {
    console.error('POST /api/referrals/payout-upi error:', err);
    res.status(500).json({ error: 'ServerError', message: err.message || 'Failed to update UPI details' });
  }
});

export default router;

