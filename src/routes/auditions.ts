import { Router, Response } from 'express';
import Audition from '../models/Audition';
import User from '../models/User';
import Comment from '../models/Comment';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const auditions = await Audition.find().sort({ createdAt: -1 }).limit(50);
    res.json({ auditions });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return res.status(404).json({ error: 'Not found' });
    await Audition.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ audition: { ...audition.toObject(), views: (audition.views || 0) + 1 } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { language, ...rest } = req.body;
    const auditionData = { ...rest, postedById: req.user!.id, directorId: req.user!.id };
    if (language) auditionData.lang = language;
    if (rest.lang) auditionData.lang = rest.lang;
    const audition = await Audition.create(auditionData);
    res.status(201).json({ audition });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', async (req: AuthRequest, res: Response) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return res.status(404).json({ error: 'Not found' });
    const idx = audition.likedBy.indexOf(req.user!.id);
    if (idx > -1) { audition.likedBy.splice(idx, 1); audition.likes = Math.max(0, audition.likes - 1); }
    else { audition.likedBy.push(req.user!.id); audition.likes += 1; }
    await audition.save();
    res.json({ likes: audition.likes, liked: idx === -1 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return res.status(404).json({ error: 'Not found' });
    if (audition.postedById !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    const { language, ...rest } = req.body;
    const updateData = { ...rest };
    if (language) updateData.lang = language;
    const updated = await Audition.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ audition: updated });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return res.status(404).json({ error: 'Not found' });
    if (audition.postedById !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    await Audition.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/comment', async (req: AuthRequest, res: Response) => {
  try {
    const audition = await Audition.findById(req.params.id);
    if (!audition) return res.status(404).json({ error: 'Not found' });
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const comment = await Comment.create({
      targetId: req.params.id,
      targetType: 'audition',
      userId: req.user!.id,
      userName: user.fullName || user.email || 'Unknown',
      userAvatar: user.photoUrl || user.photoURL || '',
      text: req.body.text,
    });
    await Audition.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
    res.status(201).json({ comment });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
