import { Router, Response } from 'express';
import Application from '../models/Application';
import Audition from '../models/Audition';
import User from '../models/User';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Apply to an audition
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { auditionId, note } = req.body;
    if (!auditionId) return res.status(400).json({ error: 'auditionId required' });

    const audition = await Audition.findById(auditionId);
    if (!audition) return res.status(404).json({ error: 'Audition not found' });

    const existing = await Application.findOne({ auditionId, userId: req.user!.id });
    if (existing) return res.status(409).json({ error: 'Already applied' });

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const application = await Application.create({
      auditionId,
      userId: req.user!.id,
      userName: user.fullName || user.email || 'Unknown',
      userEmail: user.email || '',
      userPhoto: user.photoUrl || user.photoURL || '',
      note: note || '',
      status: 'pending',
    });

    await Audition.findByIdAndUpdate(auditionId, { $inc: { applicationsCount: 1 } });

    // Notify the audition poster
    if (audition.postedById !== req.user!.id) {
      await Notification.create({
        userId: audition.postedById,
        type: 'application',
        title: 'New Application',
        message: `${user.fullName || 'Someone'} applied for "${audition.title}"`,
        senderId: req.user!.id,
      });
    }

    res.status(201).json({ application });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// My applications
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const applications = await Application.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ applications });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Applications for a specific audition (director only)
router.get('/:auditionId', async (req: AuthRequest, res: Response) => {
  try {
    const audition = await Audition.findById(req.params.auditionId);
    if (!audition) return res.status(404).json({ error: 'Audition not found' });
    if (audition.postedById !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Only the director can view applications' });
    }
    const applications = await Application.find({ auditionId: req.params.auditionId }).sort({ createdAt: -1 });
    res.json({ applications });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Update application status (director only)
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'shortlisted', 'selected', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const audition = await Audition.findById(application.auditionId);
    if (!audition || (audition.postedById !== req.user!.id && !req.user!.isAdmin)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    application.status = status;
    await application.save();

    // Notify applicant
    await Notification.create({
      userId: application.userId,
      type: 'application',
      title: 'Application Updated',
      message: `Your application for "${audition.title}" is now ${status}`,
      senderId: req.user!.id,
    });

    res.json({ application });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
