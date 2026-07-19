import { Router, Response } from 'express';
import Comment from '../models/Comment';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/comments/:targetType/:targetId
router.get('/:targetType/:targetId', async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const comments = await Comment.find({ targetId, targetType: targetType as any })
      .sort({ createdAt: -1 }).limit(100);
    res.json({ comments });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/comments/:targetType/:targetId
router.post('/:targetType/:targetId', async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

    const user = await User.findById(req.user!.id);
    const comment = await Comment.create({
      targetId,
      targetType: targetType as any,
      userId: req.user!.id,
      userName: user?.fullName || user?.name || req.user!.email?.split('@')[0] || 'User',
      userAvatar: user?.photoUrl || user?.photoURL || '',
      text: text.trim(),
    });

    // Update count on parent
    const ModelMap: Record<string, any> = {
      audition: 'Audition', film: 'Film', reel: 'Reel',
      feedPost: 'FeedPost', contestEntry: 'ContestEntry',
    };
    const modelName = ModelMap[targetType];
    if (modelName) {
      const mongoose = require('mongoose');
      const model = mongoose.model(modelName);
      await model.findByIdAndUpdate(targetId, { $inc: { commentsCount: 1 } });
    }

    res.status(201).json({ comment });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/comments/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user!.id) return res.status(403).json({ error: 'Not authorized' });
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
