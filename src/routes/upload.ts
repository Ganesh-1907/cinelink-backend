import { Router, Request, Response } from 'express';
import { firestore } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
const router = Router();
router.use(authMiddleware);

router.post('/notification-token', async (req: Request, res: Response) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    await firestore().collection('users').doc(req.user!.uid).set({ fcmToken: token, platform: platform || 'unknown' }, { merge: true });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
