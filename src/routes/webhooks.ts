import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Payment from '../models/Payment';
import Subscription from '../models/Subscription';

const router = Router();

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    
    if (!verifySignature(JSON.stringify(req.body), signature, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = req.body.event;
    const payload = req.body.payload;
    
    if (event === 'payment.captured') {
      const { id, order_id, amount, email } = payload.payment.entity;
      await Payment.create({ paymentId: id, orderId: order_id, amount: amount / 100, userEmail: email, status: 'success', paidAt: new Date() });
    }
    
    if (event === 'subscription.charged' || event === 'subscription.activated') {
      const { id, plan_id, customer_id, notes } = payload.subscription.entity;
      const userId = notes?.userId;
      if (userId) {
        const tier = Object.entries(TIER_PLAN_IDS).find(([, v]) => v === plan_id)?.[0] || 'premiere';
        const user = await User.findById(userId);
        if (user) {
          user.premiumTier = tier;
          user.premiumExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          user.verifiedReal = true;
          user.subscriptionId = id;
          await user.save();
        }
        await Subscription.create({ userId, tier, subscriptionId: id, status: event === 'subscription.charged' ? 'active' : 'active' });
      }
    }
    
    if (event === 'subscription.cancelled' || event === 'subscription.expired') {
      const { notes, id } = payload.subscription.entity;
      const userId = notes?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, { premiumTier: 'none', premiumExpiry: null, subscriptionId: null, verifiedReal: false });
        await Subscription.findOneAndUpdate({ subscriptionId: id }, { status: event === 'subscription.cancelled' ? 'cancelled' : 'expired' });
      }
    }
    
    res.json({ status: 'ok' });
  } catch (e: any) {
    console.error('[Webhook] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

const TIER_PLAN_IDS: Record<string, string> = {
  spotlight: 'plan_T79TclEwk342h5', marquee: 'plan_T79YHTe84YkAZt',
  premiere: 'plan_T79Yu7hDIJWKKO', premiereElite: 'plan_T79Zlz9XoAR9lt',
};

export default router;
