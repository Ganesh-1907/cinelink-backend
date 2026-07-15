import { Router, Request, Response } from 'express';
import { firestore, FieldValue } from '../config/firebase';
import { getRazorpay, TIER_CONFIG } from '../config/razorpay';
import { razorpayWebhookMiddleware } from '../middleware/webhook';
const Timestamp = require('firebase-admin').firestore.Timestamp;
const router = Router();

router.post('/razorpay', razorpayWebhookMiddleware, async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log('[Razorpay Webhook] Event:', event.event);
    switch (event.event) {
      case 'payment.captured': {
        const p = event.payload.payment.entity, n = p.notes || {};
        if (p.subscription_id) break;
        await firestore().collection('payments').add({ paymentId: p.id, orderId: p.order_id, userId: n.userId || '', userEmail: n.userEmail || '', amount: p.amount / 100, status: 'success', method: p.method, purpose: n.purpose || 'general', itemId: n.itemId || '', itemTitle: n.itemTitle || '', paidAt: FieldValue.serverTimestamp() });
        if (n.purpose === 'contest_entry' && n.itemId && n.userId) {
          const e = await firestore().collection('contestEntries').where('contestId', '==', n.itemId).where('userId', '==', n.userId).get();
          if (e.empty) { await firestore().collection('contestEntries').add({ contestId: n.itemId, contestTitle: n.itemTitle || '', userId: n.userId, userEmail: n.userEmail || '', videoLink: n.videoLink || '', votes: 0, juryScore: 0, finalScore: 0, paid: true, paymentId: p.id, createdAt: FieldValue.serverTimestamp() }); try { await firestore().collection('contests').doc(n.itemId).update({ entriesCount: FieldValue.increment(1) }); } catch {} }
        }
        if (n.purpose === 'film_upload' && n.itemId) { await firestore().collection('films').doc(n.itemId).update({ paid: true }); }
        break;
      }
      case 'subscription.charged': {
        const s = event.payload.subscription?.entity, sn = s?.notes || {};
        if (s && sn.userId && sn.tier && TIER_CONFIG[sn.tier]) {
          const cfg = TIER_CONFIG[sn.tier], now = new Date(), exp = new Date(now); exp.setMonth(exp.getMonth() + cfg.durationMonths);
          await firestore().collection('subscriptions').add({ userId: sn.userId, tier: sn.tier, paymentId: event.payload.payment?.entity?.id || '', subscriptionId: s.id, startDate: Timestamp.fromDate(now), endDate: Timestamp.fromDate(exp), status: 'active', createdAt: FieldValue.serverTimestamp() });
          await firestore().collection('users').doc(sn.userId).update({ premiumTier: sn.tier, premiumExpiry: Timestamp.fromDate(exp), subscriptionId: s.id, verifiedReal: true });
        }
        break;
      }
      case 'subscription.activated': {
        const a = event.payload.subscription?.entity, an = a?.notes || {};
        if (a && an.userId && an.tier && TIER_CONFIG[an.tier]) {
          const cfg = TIER_CONFIG[an.tier], now = new Date(), exp = new Date(now); exp.setMonth(exp.getMonth() + cfg.durationMonths);
          await firestore().collection('users').doc(an.userId).update({ premiumTier: an.tier, premiumExpiry: Timestamp.fromDate(exp), subscriptionId: a.id, verifiedReal: true });
          await firestore().collection('subscriptions').add({ userId: an.userId, tier: an.tier, subscriptionId: a.id, startDate: Timestamp.fromDate(now), endDate: Timestamp.fromDate(exp), status: 'active', createdAt: FieldValue.serverTimestamp() });
        }
        break;
      }
      case 'subscription.cancelled': case 'subscription.expired': {
        const c = event.payload.subscription?.entity, cn = c?.notes || {};
        if (c && cn.userId) { await firestore().collection('users').doc(cn.userId).update({ premiumTier: 'none', premiumExpiry: null, subscriptionId: null, verifiedReal: false }); }
        break;
      }
      default: console.log('Unhandled webhook event:', event.event);
    }
    res.json({ status: 'ok' });
  } catch (e: any) { console.error('Webhook error:', e); res.json({ status: 'ok' }); }
});

export default router;
