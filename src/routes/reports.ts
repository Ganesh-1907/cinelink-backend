import { Router, Response } from 'express';
import Report from '../models/Report';
import { authMiddleware, AuthRequest } from '../middleware/auth';
const router = Router(); router.use(authMiddleware);
router.post('/', async (req: AuthRequest, res: Response) => { try { const report = await Report.create({ ...req.body, userId: req.user!.id }); res.status(201).json({ report }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.get('/', async (req: AuthRequest, res: Response) => { try { const reports = await Report.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50); res.json({ reports }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
export default router;
