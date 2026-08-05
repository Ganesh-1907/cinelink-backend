import { Router, Response } from 'express';
import Film from '../models/Film';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
const router = Router(); router.use(authMiddleware);
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const filter = {
      $or: [
        { isPrivate: { $ne: true } },
        { userId: req.user!.id },
      ],
    };
    const films = await Film.find(filter).sort({ createdAt: -1 }).limit(50);
    const userIds = [...new Set(films.map(f => f.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('fullName displayName photoUrl photoURL role');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const filmsWithCreator = films.map(f => {
      const u = userMap.get(f.userId);
      return {
        ...f.toObject(),
        creatorName: u?.fullName || u?.displayName || f.userEmail?.split('@')[0] || 'Director',
        creatorPhotoUrl: u?.photoUrl || u?.photoURL || null,
        creatorRole: u?.role || 'Director',
        id: f._id.toString(),
      };
    });

    res.json({ films: filmsWithCreator });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) return res.status(404).json({ error: 'Not found' });
    await Film.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    const u = await User.findById(film.userId).select('fullName displayName photoUrl photoURL role location');
    const filmWithCreator = {
      ...film.toObject(),
      creatorName: u?.fullName || u?.displayName || film.userEmail?.split('@')[0] || 'Director',
      creatorPhotoUrl: u?.photoUrl || u?.photoURL || null,
      creatorRole: u?.role || 'Director',
      creatorLocation: u?.location || '',
      views: (film.views || 0) + 1,
      id: film._id.toString(),
    };
    res.json({ film: filmWithCreator });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post('/', async (req: AuthRequest, res: Response) => { try { const film = await Film.create({ ...req.body, userId: req.user!.id }); res.status(201).json({ film }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.post('/:id/like', async (req: AuthRequest, res: Response) => { try { const f = await Film.findById(req.params.id); if (!f) return res.status(404).json({ error: '' }); const idx = f.likedBy.indexOf(req.user!.id); if (idx > -1) { f.likedBy.splice(idx, 1); f.likes = Math.max(0, f.likes - 1); } else { f.likedBy.push(req.user!.id); f.likes += 1; } await f.save(); res.json({ likes: f.likes, liked: idx === -1 }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.put('/:id', async (req: AuthRequest, res: Response) => { try { const film = await Film.findById(req.params.id); if (!film) return res.status(404).json({ error: 'Not found' }); if (film.userId !== req.user!.id && !req.user!.isAdmin) return res.status(403).json({ error: 'Permission denied' }); const updated = await Film.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ film: updated }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
router.delete('/:id', async (req: AuthRequest, res: Response) => { try { const film = await Film.findById(req.params.id); if (!film) return res.status(404).json({ error: 'Not found' }); if (film.userId !== req.user!.id && !req.user!.isAdmin) return res.status(403).json({ error: 'Permission denied' }); await Film.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }});
export default router;
