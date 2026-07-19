import { Router, Response } from 'express';
import Razorpay from 'razorpay';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Payment from '../models/Payment';
import { env } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ tier: user.premiumTier, expiry: user.premiumExpiry, verifiedReal: user.verifiedReal, subscriptionId: user.subscriptionId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user?.subscriptionId) return res.status(400).json({ error: 'No active subscription' });
    
    try {
      const razorpay = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
      await razorpay.subscriptions.cancel(user.subscriptionId);
    } catch (e) { console.warn('[Premium] Razorpay cancel error:', e); }
    
    await User.findByIdAndUpdate(req.user!.id, { premiumTier: 'none', premiumExpiry: null, subscriptionId: null, verifiedReal: false });
    await Subscription.create({ userId: req.user!.id, tier: user.premiumTier, subscriptionId: user.subscriptionId, status: 'cancelled' });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const subs = await Subscription.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ subscriptions: subs });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/receipts', async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find({ userId: req.user!.id, purpose: 'premium' }).sort({ paidAt: -1 }).limit(20);
    res.json({ payments });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Upgrade/change tier (after payment verification)
router.post('/upgrade', async (req: AuthRequest, res: Response) => {
  try {
    const { tier, paymentId } = req.body;
    const validTiers = ['spotlight', 'marquee', 'premiere', 'premiereElite'];
    if (!validTiers.includes(tier)) return res.status(400).json({ error: 'Invalid tier' });

    const tierDurations: Record<string, number> = {
      spotlight: 30, marquee: 60, premiere: 90, premiereElite: 365,
    };

    const user = await User.findByIdAndUpdate(req.user!.id, {
      premiumTier: tier,
      premiumExpiry: new Date(Date.now() + tierDurations[tier] * 86400000),
      verifiedReal: true,
    }, { new: true });

    await Subscription.create({
      userId: req.user!.id, tier, paymentId: paymentId || '',
      status: 'active', startDate: new Date(),
      endDate: new Date(Date.now() + tierDurations[tier] * 86400000),
    });

    res.json({ tier: user?.premiumTier, expiry: user?.premiumExpiry });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
