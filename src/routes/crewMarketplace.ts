import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Crew from '../models/Crew';
const router = Router(); router.use(authMiddleware);
router.get('/', async (_req: AuthRequest, res: Response) => { try { const posts = await Crew.find().sort({ createdAt: -1 }).limit(50); res.json({ posts }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.post('/', async (req: AuthRequest, res: Response) => { try { const p = await Crew.create({ ...req.body, userId: req.user!.id }); res.status(201).json({ post: p }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
export default router;
