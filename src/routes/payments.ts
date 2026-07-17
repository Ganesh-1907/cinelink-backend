import { Router, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Payment from '../models/Payment';
import ContestEntry from '../models/ContestEntry';
import Contest from '../models/Contest';
import Film from '../models/Film';

const router = Router();
router.use(authMiddleware);

function getRazorpay(): Razorpay {
  return new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
}

const TIER_PLAN_IDS: Record<string, string> = {
  spotlight: 'plan_T79TclEwk342h5', marquee: 'plan_T79YHTe84YkAZt',
  premiere: 'plan_T79Yu7hDIJWKKO', premiereElite: 'plan_T79Zlz9XoAR9lt',
};

router.post('/create-order', async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency = 'INR', notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), currency,
      receipt: 'receipt_' + Date.now(),
      notes: { userId: req.user!.id, userEmail: req.user!.email, ...notes },
    });
    res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: env.razorpay.keyId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/create-subscription', async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = req.body;
    if (!TIER_PLAN_IDS[tier]) return res.status(400).json({ error: 'Invalid tier' });
    const sub = await getRazorpay().subscriptions.create({
      plan_id: TIER_PLAN_IDS[tier], total_count: 12, quantity: 1,
      customer_notify: 1, notes: { userId: req.user!.id, tier },
    });
    res.json({ success: true, subscriptionId: sub.id, keyId: env.razorpay.keyId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/verify-payment', async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const hmac = crypto.createHmac('sha256', env.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    res.json({ success: true, verified: hmac === razorpay_signature });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/save-payment', async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, orderId, amount, purpose, itemId, itemTitle, videoLink, status } = req.body;
    const payment = await Payment.create({
      userId: req.user!.id, userEmail: req.user!.email,
      amount: amount / 100, orderId, paymentId,
      purpose, itemId: itemId || '', itemTitle, videoLink, status: status || 'success', paidAt: new Date(),
    });
    if (purpose === 'contest_entry' && itemId) {
      await ContestEntry.create({ contestId: itemId, contestTitle: itemTitle, userId: req.user!.id, paid: true, paymentId });
      await Contest.findByIdAndUpdate(itemId, { $inc: { entriesCount: 1 } });
    } else if (purpose === 'film_upload' && itemId) {
      await Film.findByIdAndUpdate(itemId, { paid: true });
    }
    res.json({ success: true, payment });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/check-duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, purpose } = req.query;
    if (!itemId || !purpose) return res.json({ alreadyPaid: false });
    const existingPayment = await Payment.findOne({ userId: req.user!.id, itemId: itemId as string, status: 'success' });
    if (existingPayment) return res.json({ alreadyPaid: true });
    if (purpose === 'contest_entry') {
      const entry = await ContestEntry.findOne({ contestId: itemId as string, userId: req.user!.id });
      if (entry) return res.json({ alreadyPaid: true });
    }
    res.json({ alreadyPaid: false });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find({ userId: req.user!.id }).sort({ paidAt: -1 } as any);
    res.json({ payments });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
