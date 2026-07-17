import { Router, Response } from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { query, role, limit: limitParam } = req.query;
    const maxLimit = Math.min(Number(limitParam) || 50, 100);
    const filter: any = {};
    if (role && role !== 'All') filter.role = role;
    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').limit(maxLimit);
    res.json({ users, total: users.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/suggested', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: { $in: ['Director', 'Producer', 'Cinematographer', 'Writer'] } })
      .select('-password').limit(20);
    res.json({ users: users.filter(u => u._id.toString() !== req.user!.id) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
