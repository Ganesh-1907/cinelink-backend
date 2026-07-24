import { Router, Response } from 'express';
import Contest from '../models/Contest';
import ContestEntry from '../models/ContestEntry';
import ContestVote from '../models/ContestVote';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;
    const contests = await Contest.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ contests });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Get contests entered by current user (BEFORE /:id to avoid route conflict) ──
router.get('/user/entered', async (req: AuthRequest, res: Response) => {
  try {
    const entries = await ContestEntry.find({ userId: req.user!.id }).select('contestId');
    const contestIds = entries.map(e => e.contestId);
    const contests = await Contest.find({ _id: { $in: contestIds } }).sort({ createdAt: -1 });
    res.json({ contests });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    res.json({ contest });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const contest = await Contest.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ contest });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/enter', async (req: AuthRequest, res: Response) => {
  try {
    const entry = await ContestEntry.create({
      contestId: req.params.id, ...req.body, userId: req.user!.id,
    });
    await Contest.findByIdAndUpdate(req.params.id, { $inc: { entriesCount: 1 } });

    const contest = await Contest.findById(req.params.id);
    if (contest && contest.createdBy !== req.user!.id) {
      const user = await User.findById(req.user!.id);
      await Notification.create({
        userId: contest.createdBy,
        type: 'contest_entry',
        title: 'New Contest Entry',
        message: `${user?.fullName || user?.name || req.user!.email} entered your contest`,
        senderId: req.user!.id,
      });
    }
    res.status(201).json({ entry });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Vote for a contest entry ──
router.post('/:contestId/entries/:entryId/vote', async (req: AuthRequest, res: Response) => {
  try {
    const { contestId, entryId } = req.params;
    const existing = await ContestVote.findOne({ contestId, voterId: req.user!.id });
    if (existing) return res.status(400).json({ error: 'Already voted' });

    await ContestVote.create({ contestId, entryId, voterId: req.user!.id });
    await ContestEntry.findByIdAndUpdate(entryId, { $inc: { votes: 1 } });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Get entries for a contest ──
router.get('/:id/entries', async (req: AuthRequest, res: Response) => {
  try {
    const entries = await ContestEntry.find({ contestId: req.params.id })
      .sort({ votes: -1, createdAt: -1 });
    res.json({ entries });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
