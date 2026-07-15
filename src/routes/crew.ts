import { Router, Request, Response } from 'express';
import { firestore } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, role, limit: limitParam } = req.query;
    const limit = Math.min(Number(limitParam) || 50, 100);

    let q: FirebaseFirestore.Query = firestore().collection('users');

    if (role && role !== 'All') {
      q = q.where('role', '==', role);
    }

    q = q.limit(limit);
    const snapshot = await q.get();

    let users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (query && typeof query === 'string' && query.trim()) {
      const searchTerm = query.toLowerCase();
      users = users.filter((u: any) => {
        const name = (u.fullName || u.displayName || u.name || '').toLowerCase();
        const bio = (u.bio || '').toLowerCase();
        const location = (u.location || '').toLowerCase();
        return name.includes(searchTerm) || bio.includes(searchTerm) || location.includes(searchTerm);
      });
    }

    res.json({ users, total: users.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/suggested', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const snapshot = await firestore()
      .collection('users')
      .where('role', 'in', ['Director', 'Producer', 'Cinematographer', 'Writer'])
      .limit(limit)
      .get();

    const users = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((u: any) => u.id !== req.user!.uid);

    res.json({ users });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
