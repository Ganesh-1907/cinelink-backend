import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const notifications = await Notification.find({ userId: req.user!.id })
      .sort({ createdAt: -1 }).limit(limit);
    const unreadCount = await Notification.countDocuments({ userId: req.user!.id, read: false });
    res.json({ notifications, unreadCount });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.user!.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { read: true });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/push', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !title) return res.status(400).json({ error: 'userId and title required' });
    await Notification.create({ userId, type: type || 'general', title, message: message || '', senderId: req.user!.id });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
