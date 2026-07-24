import { Router, Response } from 'express';
import User from '../models/User';
import Report from '../models/Report';
import Notification from '../models/Notification';
import Audition from '../models/Audition';
import BannedUser from '../models/BannedUser';
import VerificationRequest from '../models/VerificationRequest';
import CastingRequest from '../models/CastingRequest';
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
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(limit).lean();
    // Add ban status to each user
    const bannedUsers = await BannedUser.find({ userId: { $in: users.map((u: any) => u._id.toString()) } }).lean();
    const bannedSet = new Set(bannedUsers.map((b: any) => b.userId));
    const usersWithBan = users.map((u: any) => ({ ...u, banned: bannedSet.has(u._id.toString()) }));
    res.json({ users: usersWithBan });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:userId/ban', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { reason } = req.body;
    const existing = await BannedUser.findOne({ userId: req.params.userId });
    if (existing) {
      // Unban
      await BannedUser.findByIdAndDelete(existing._id);
      res.json({ success: true, banned: false });
    } else {
      // Ban
      await BannedUser.create({ userId: req.params.userId, reason: reason || '', bannedBy: req.user!.id });
      res.json({ success: true, banned: true });
    }
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
    const requests = await VerificationRequest.find().sort({ createdAt: -1 });
    res.json({ requests });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/verification-requests/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    const vr = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user!.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!vr) return res.status(404).json({ error: 'Verification request not found' });

    // Update user's verificationStatus
    await User.findByIdAndUpdate(vr.userId, {
      verificationStatus: status === 'approved' ? 'verified' : '',
      verifiedReal: status === 'approved',
    });

    // Notify user
    await Notification.create({
      userId: vr.userId,
      type: 'verification',
      title: status === 'approved' ? 'Verified!' : 'Verification Rejected',
      message: status === 'approved'
        ? 'Your profile has been verified. You now have the blue checkmark!'
        : 'Your verification request was rejected. You can submit a new one.',
    });

    res.json({ request: vr });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Casting Director Requests ──
router.get('/casting-requests', async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await CastingRequest.find().sort({ createdAt: -1 });
    res.json({ requests });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/casting-requests/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    const cr = await CastingRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user!.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!cr) return res.status(404).json({ error: 'Casting request not found' });

    if (status === 'approved') {
      await User.findByIdAndUpdate(cr.userId, {
        isApprovedDirector: true,
        role: 'Director',
      });
      await Notification.create({
        userId: cr.userId,
        type: 'casting_approved',
        title: '🎬 Casting Director Approved!',
        message: 'Your casting director application has been approved. You can now post auditions!',
      });
    } else {
      await Notification.create({
        userId: cr.userId,
        type: 'casting_rejected',
        title: 'Casting Director Rejected',
        message: 'Your casting director application was not approved. You can submit a new application.',
      });
    }

    res.json({ request: cr });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
