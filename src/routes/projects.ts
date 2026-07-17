import { Router, Response } from 'express';
import Project from '../models/Project';
import { authMiddleware, AuthRequest } from '../middleware/auth';
const router = Router(); router.use(authMiddleware);
router.get('/', async (_req: AuthRequest, res: Response) => { try { const projects = await Project.find().sort({ createdAt: -1 }).limit(50); res.json({ projects }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.get('/:id', async (req: AuthRequest, res: Response) => { try { const p = await Project.findById(req.params.id); if (!p) return res.status(404).json({ error: '' }); res.json({ project: p }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.post('/', async (req: AuthRequest, res: Response) => { try { const p = await Project.create({ ...req.body, createdBy: req.user!.id, members: [req.user!.id] }); res.status(201).json({ project: p }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.post('/:id/join', async (req: AuthRequest, res: Response) => { try { await Project.findByIdAndUpdate(req.params.id, { $addToSet: { members: req.user!.id } }); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
export default router;
