import { Router, Request, Response } from 'express';
import { getRazorpay, TIER_PLAN_IDS } from '../config/razorpay';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';
import { env } from '../config/env';

const router = Router();
router.use(authMiddleware);

router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), currency,
      receipt: 'receipt_' + Date.now(),
      notes: { userId: req.user!.uid, userEmail: req.user!.email, ...notes },
    });
    res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: env.razorpay.keyId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;
    if (!TIER_PLAN_IDS[tier]) return res.status(400).json({ error: 'Invalid tier: ' + tier });
    const sub = await getRazorpay().subscriptions.create({ plan_id: TIER_PLAN_IDS[tier], total_count: 12, quantity: 1, customer_notify: 1, notes: { userId: req.user!.uid, tier } });
    res.json({ success: true, subscriptionId: sub.id, keyId: env.razorpay.keyId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: 'Missing fields' });
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(body).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ error: 'Invalid signature', verified: false });
    res.json({ verified: true, paymentId: razorpay_payment_id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/save-payment', async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, amount, purpose, itemId, itemTitle, videoLink } = req.body;
    const user = req.user!;
    const existing = await firestore().collection('payments').where('paymentId', '==', paymentId).get();
    if (!existing.empty) return res.status(409).json({ error: 'Already recorded' });
    await firestore().collection('payments').add({ userId: user.uid, userEmail: user.email, amount, purpose, itemId, itemTitle, videoLink: videoLink || '', orderId, paymentId, status: 'success', paidAt: FieldValue.serverTimestamp() });
    if (purpose === 'contest_entry' && itemId) {
      const entry = await firestore().collection('contestEntries').where('contestId', '==', itemId).where('userId', '==', user.uid).get();
      if (entry.empty) {
        await firestore().collection('contestEntries').add({ contestId: itemId, contestTitle: itemTitle, userId: user.uid, userEmail: user.email, videoLink: videoLink || '', votes: 0, juryScore: 0, finalScore: 0, paid: true, paymentId, createdAt: FieldValue.serverTimestamp() });
        try { await firestore().collection('contests').doc(itemId).update({ entriesCount: FieldValue.increment(1) }); } catch {}
      }
    }
    if (purpose === 'film_upload' && itemId) { await firestore().collection('films').doc(itemId).update({ paid: true }); }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/check-duplicate', async (req: Request, res: Response) => {
  try {
    const { itemId, purpose } = req.query;
    if (!itemId) return res.status(400).json({ error: 'itemId required' });
    const snap = await firestore().collection('payments').where('userId', '==', req.user!.uid).where('itemId', '==', itemId).where('status', '==', 'success').get();
    if (!snap.empty) return res.json({ alreadyPaid: true });
    if (purpose === 'contest_entry') {
      const entrySnap = await firestore().collection('contestEntries').where('contestId', '==', itemId).where('userId', '==', req.user!.uid).get();
      if (!entrySnap.empty) return res.json({ alreadyPaid: true });
    }
    res.json({ alreadyPaid: false });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const snap = await firestore().collection('payments').where('userId', '==', req.user!.uid).orderBy('paidAt', 'desc').get();
    res.json({ payments: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
