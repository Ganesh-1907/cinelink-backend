import { Router, Request, Response } from 'express';
import { getRazorpay } from '../config/razorpay';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/active', async (req: Request, res: Response) => {
  try {
    const userDoc = await firestore().collection('users').doc(req.user!.uid).get();
    const data = userDoc.data();
    res.json({
      tier: data?.premiumTier || 'none',
      expiry: data?.premiumExpiry?.toDate?.()?.toISOString() || null,
      verifiedReal: data?.verifiedReal || false,
      subscriptionId: data?.subscriptionId || null,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const userDoc = await firestore().collection('users').doc(req.user!.uid).get();
    const data = userDoc.data();
    if (!data?.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription' });
    }
    try {
      await getRazorpay().subscriptions.cancel(data.subscriptionId);
    } catch (e) {
      console.warn('[Premium] Razorpay cancel error:', e);
    }
    await firestore().collection('users').doc(req.user!.uid).update({
      premiumTier: 'none',
      premiumExpiry: null,
      subscriptionId: null,
      verifiedReal: false,
    });
    await firestore().collection('subscriptions').add({
      userId: req.user!.uid,
      tier: data.premiumTier,
      subscriptionId: data.subscriptionId,
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
    });
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const snap = await firestore()
      .collection('subscriptions')
      .where('userId', '==', req.user!.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    res.json({ subscriptions: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/receipts', async (req: Request, res: Response) => {
  try {
    const snap = await firestore()
      .collection('payments')
      .where('userId', '==', req.user!.uid)
      .where('purpose', '==', 'premium')
      .orderBy('paidAt', 'desc')
      .limit(20)
      .get();
    res.json({ payments: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
