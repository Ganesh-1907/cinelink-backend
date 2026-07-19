import { Router, Response } from 'express';
import FeedPost from '../models/FeedPost';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const posts = await FeedPost.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ posts });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const post = await FeedPost.create({ ...req.body, userId: req.user!.id });
    res.status(201).json({ post });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.userId !== req.user!.id && !req.user!.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const updated = await FeedPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ post: updated });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.userId !== req.user!.id && !req.user!.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await FeedPost.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', async (req: AuthRequest, res: Response) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    const idx = post.likedBy.indexOf(req.user!.id);
    if (idx > -1) { post.likedBy.splice(idx, 1); post.likes = Math.max(0, post.likes - 1); }
    else { post.likedBy.push(req.user!.id); post.likes += 1; }
    await post.save();
    res.json({ likes: post.likes, liked: idx === -1 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
