import { Router, Response } from 'express';
import SavedAudition from '../models/SavedAudition';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const saved = await SavedAudition.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ saved });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { auditionId } = req.body;
    if (!auditionId) return res.status(400).json({ error: 'auditionId required' });
    const existing = await SavedAudition.findOne({ userId: req.user!.id, auditionId });
    if (existing) { await SavedAudition.findByIdAndDelete(existing._id); return res.json({ saved: false }); }
    await SavedAudition.create({ userId: req.user!.id, auditionId });
    res.status(201).json({ saved: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:auditionId', async (req: AuthRequest, res: Response) => {
  try {
    await SavedAudition.findOneAndDelete({ userId: req.user!.id, auditionId: req.params.auditionId });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
