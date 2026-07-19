import { Router, Response } from 'express';
import Feedback from '../models/Feedback';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const feedback = await Feedback.create({ ...req.body, userId: req.user!.id, email: req.user!.email });
    res.status(201).json({ feedback });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const feedback = await Feedback.find().sort({ createdAt: -1 }).limit(100);
    res.json({ feedback });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
