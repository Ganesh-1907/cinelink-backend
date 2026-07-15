import { Router, Request, Response } from 'express';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/start', async (req: Request, res: Response) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });

    const roomId = [req.user!.uid, otherUserId].sort().join('_') + '_call';
    const room = {
      participants: [req.user!.uid, otherUserId],
      initiator: req.user!.uid,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    };
    await firestore().collection('callRooms').doc(roomId).set(room);

    await firestore().collection('notifications').add({
      userId: otherUserId,
      type: 'video_call',
      title: '📹 Video Call',
      message: 'You have an incoming video call request',
      senderId: req.user!.uid,
      roomId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.json({ success: true, roomId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:roomId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'ended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await firestore().collection('callRooms').doc(req.params.roomId).update({ status });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
