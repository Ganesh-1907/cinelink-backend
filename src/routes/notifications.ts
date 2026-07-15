import { Router, Request, Response } from 'express';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import { sendPush } from '../services/pushService';

const router = Router();
router.use(authMiddleware);

// ── Send a push notification (client-driven: follows, etc.) ──────────────────
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required' });
    }

    // Save notification to Firestore
    await firestore().collection('notifications').add({
      userId,
      title,
      message: body,
      type: data?.type || 'general',
      senderId: req.user!.uid,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      ...(data || {}),
    });

    // Send push
    const pushed = await sendPush({ userId, title, body, data });
    res.json({ success: true, pushDelivered: pushed });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
