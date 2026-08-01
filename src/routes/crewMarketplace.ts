import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Crew from '../models/Crew';
import User from '../models/User';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { craft, location, search } = req.query;
    const filter: any = {};
    if (craft && craft !== 'All') filter.craft = craft;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    const posts = await Crew.find(filter).sort({ createdAt: -1 }).limit(50);
    
    // Populate user profile info manually
    const userIds = posts.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('fullName displayName photoUrl role');
    const userMap = new Map(users.map(u => [u.id, u]));
    
    const populated = posts.map(p => ({
      ...p.toObject(),
      creator: userMap.get(p.userId) || null
    }));

    res.json({ posts: populated });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const p = await Crew.create({ ...req.body, userId: req.user!.id });
    res.status(201).json({ post: p });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await Crew.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.userId !== req.user!.id && !req.user!.isAdmin)
      return res.status(403).json({ error: 'Permission denied' });
    const updated = await Crew.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ post: updated });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await Crew.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.userId !== req.user!.id && !req.user!.isAdmin)
      return res.status(403).json({ error: 'Permission denied' });
    await Crew.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
