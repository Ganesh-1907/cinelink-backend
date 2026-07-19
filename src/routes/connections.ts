import { Router, Response } from 'express';
import Connection from '../models/Connection';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendPushNotification } from '../services/pushService';

const router = Router();
router.use(authMiddleware);

router.post('/request', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.body.targetId || req.body.targetUserId;
    if (!targetId || targetId === req.user!.id) return res.status(400).json({ error: 'Invalid target' });
    const existing = await Connection.findOne({ requesterId: req.user!.id, targetId });
    if (existing) return res.status(409).json({ error: 'Request already exists' });
    const conn = await Connection.create({ requesterId: req.user!.id, targetId });
    await Notification.create({ userId: targetId, type: 'connect_request', title: 'Connection Request', message: `${req.user!.email} wants to connect`, senderId: req.user!.id });
    sendPushNotification(targetId, 'Connection Request', `${req.user!.email} wants to connect`).catch(() => {});
    res.status(201).json({ connection: conn });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/respond', async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, status, requesterId } = req.body;
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    let conn;
    if (requesterId) {
      conn = await Connection.findOne({ requesterId, targetId: req.user!.id, status: 'pending' });
    } else {
      conn = await Connection.findById(requestId);
    }
    if (!conn || conn.targetId !== req.user!.id) return res.status(404).json({ error: 'Not found' });
    conn.status = status; await conn.save();
    if (status === 'accepted') {
      await Notification.create({ userId: conn.requesterId, type: 'connect_accepted', title: 'Connection Accepted', message: `${req.user!.email} accepted your request`, senderId: req.user!.id });
    }
    res.json({ connection: conn });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const connections = await Connection.find({ $or: [{ requesterId: req.user!.id }, { targetId: req.user!.id }], status: 'accepted' });
    res.json({ connections });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/pending', async (req: AuthRequest, res: Response) => {
  try {
    const requests = await Connection.find({ targetId: req.user!.id, status: 'pending' });
    res.json({ requests });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
