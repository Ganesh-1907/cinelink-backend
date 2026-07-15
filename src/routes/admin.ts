import { Router, Request, Response } from 'express';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
const router = Router();
router.use(authMiddleware);

const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
};

router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const [u, r, v, c] = await Promise.all([
      firestore().collection('users').get(), firestore().collection('reports').get(),
      firestore().collection('verificationRequests').get(), firestore().collection('castingRequests').get(),
    ]);
    res.json({ totalUsers: u.size, totalReports: r.size, pendingVerifications: v.size, pendingCastingRequests: c.size });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/reports', requireAdmin, async (req: Request, res: Response) => {
  try {
    const snap = await firestore().collection('reports').orderBy('createdAt','desc').get();
    res.json({ reports: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/reports/:reportId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['reviewed','action_taken','dismissed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await firestore().collection('reports').doc(req.params.reportId).update({ status, reviewedBy: req.user!.uid, reviewedAt: FieldValue.serverTimestamp() });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const snap = await firestore().collection('users').limit(limit).get();
    res.json({ users: snap.docs.map(d => ({ id: d.id, uid: d.data().uid, displayName: d.data().displayName || d.data().fullName || d.data().name, email: d.data().email, role: d.data().role, isApprovedDirector: d.data().isApprovedDirector, verificationStatus: d.data().verificationStatus, createdAt: d.data().createdAt })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:userId/ban', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { banned } = req.body;
    if (banned) { await firestore().collection('bannedUsers').doc(req.params.userId).set({ bannedAt: FieldValue.serverTimestamp(), bannedBy: req.user!.uid }); }
    else { await firestore().collection('bannedUsers').doc(req.params.userId).delete(); }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role, isApprovedDirector, verificationStatus } = req.body;
    const updates: any = {};
    if (role) updates.role = role;
    if (isApprovedDirector !== undefined) updates.isApprovedDirector = isApprovedDirector;
    if (verificationStatus) updates.verificationStatus = verificationStatus;
    await firestore().collection('users').doc(req.params.userId).update(updates);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/verification-requests', requireAdmin, async (req: Request, res: Response) => {
  try {
    const snap = await firestore().collection('verificationRequests').orderBy('requestedAt','desc').get();
    res.json({ requests: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
