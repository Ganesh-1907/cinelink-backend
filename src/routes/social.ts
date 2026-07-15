import { Router, Request, Response } from 'express';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/events', async (req: Request, res: Response) => {
  try {
    const { title, description, date, location, type, link } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
    const event = {
      title, description, date, location, type: type || 'workshop',
      link, postedBy: req.user!.uid, attendees: 0,
      createdAt: FieldValue.serverTimestamp(),
    };
    const ref = await firestore().collection('events').add(event);
    res.json({ success: true, eventId: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/events', async (req: Request, res: Response) => {
  try {
    const snap = await firestore()
      .collection('events')
      .orderBy('date', 'asc')
      .limit(50)
      .get();
    res.json({ events: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/groups', async (req: Request, res: Response) => {
  try {
    const { name, description, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const group = {
      name, description, type: type || 'language',
      createdBy: req.user!.uid, members: [req.user!.uid], memberCount: 1,
      createdAt: FieldValue.serverTimestamp(),
    };
    const ref = await firestore().collection('groups').add(group);
    res.json({ success: true, groupId: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/groups', async (req: Request, res: Response) => {
  try {
    const snap = await firestore()
      .collection('groups')
      .orderBy('memberCount', 'desc')
      .limit(50)
      .get();
    res.json({ groups: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/groups/:groupId/join', async (req: Request, res: Response) => {
  try {
    await firestore().collection('groups').doc(req.params.groupId).update({
      members: FieldValue.arrayUnion(req.user!.uid),
      memberCount: FieldValue.increment(1),
    });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
