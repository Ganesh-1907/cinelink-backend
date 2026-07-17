import { Router, Response } from 'express';
import User from '../models/User';
import Report from '../models/Report';
import Notification from '../models/Notification';
import Audition from '../models/Audition';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [userCount, reportCount, pendingVerifications, auditionCount] = await Promise.all([
      User.countDocuments(), Report.countDocuments(),
      User.countDocuments({ verificationStatus: 'pending' }),
      Audition.countDocuments(),
    ]);
    res.json({ users: userCount, reports: reportCount, pendingVerifications, auditions: auditionCount });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/reports', async (_req: AuthRequest, res: Response) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ reports });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/reports/:reportId', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['reviewed', 'action_taken', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const report = await Report.findByIdAndUpdate(req.params.reportId,
      { status, reviewedBy: req.user!.id, reviewedAt: new Date() }, { new: true });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ report });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(limit);
    res.json({ users });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:userId/ban', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isAdmin = !user.isAdmin; // Toggle ban status for simplicity
    await user.save();
    res.json({ success: true, banned: !user.isAdmin });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const updates: any = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.isApprovedDirector !== undefined) updates.isApprovedDirector = req.body.isApprovedDirector;
    if (req.body.verificationStatus) updates.verificationStatus = req.body.verificationStatus;
    
    const user = await User.findByIdAndUpdate(req.params.userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/verification-requests', async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await User.find({ verificationStatus: { $ne: '' } }).select('-password').sort({ createdAt: -1 });
    res.json({ requests });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
