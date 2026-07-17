import { Router, Response } from 'express';
import Reel from '../models/Reel';
import { authMiddleware, AuthRequest } from '../middleware/auth';
const router = Router(); router.use(authMiddleware);
router.get('/', async (_req: AuthRequest, res: Response) => { try { const reels = await Reel.find().sort({ createdAt: -1 }).limit(50); res.json({ reels }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.post('/', async (req: AuthRequest, res: Response) => { try { const reel = await Reel.create({ ...req.body, creatorId: req.user!.id }); res.status(201).json({ reel }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.post('/:id/like', async (req: AuthRequest, res: Response) => { try { const r = await Reel.findById(req.params.id); if (!r) return res.status(404).json({ error: '' }); const idx = r.likedBy.indexOf(req.user!.id); if (idx > -1) { r.likedBy.splice(idx, 1); r.likes = Math.max(0, r.likes - 1); } else { r.likedBy.push(req.user!.id); r.likes += 1; } await r.save(); res.json({ likes: r.likes, liked: idx === -1 }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
export default router;
