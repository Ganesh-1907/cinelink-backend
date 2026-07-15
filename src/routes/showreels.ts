import { Router, Request, Response } from 'express';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/compile', async (req: Request, res: Response) => {
  try {
    const { title, reelIds } = req.body;
    if (!title || !reelIds?.length) {
      return res.status(400).json({ error: 'Title and reel IDs required' });
    }
    const showreel = {
      userId: req.user!.uid,
      title,
      reelIds,
      views: 0,
      createdAt: FieldValue.serverTimestamp(),
    };
    const ref = await firestore().collection('showreels').add(showreel);
    res.json({ success: true, showreelId: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || req.user!.uid;
    const snap = await firestore()
      .collection('showreels')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    res.json({ showreels: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:showreelId/view', async (req: Request, res: Response) => {
  try {
    await firestore().collection('showreels').doc(req.params.showreelId).update({
      views: FieldValue.increment(1),
    });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
