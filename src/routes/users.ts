import { Router, Request, Response } from 'express';
import { firestore, FieldValue, auth } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import { sendFollowPush } from '../services/pushService';
const router = Router();
router.use(authMiddleware);

router.get('/profile', async (req: Request, res: Response) => {
  try { const doc = await firestore().collection('users').doc(req.user!.uid).get(); if (!doc.exists) return res.status(404).json({ error: 'Not found' }); res.json({ user: { id: doc.id, ...doc.data() } }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    const allowed = ['fullName','displayName','name','phone','bio','role','location','photoUrl','photoURL','introVideoLink','portfolio1','portfolio2','portfolio3','availabilityStatus','lookingFor','profileTags','instagramLink','youtubeLink','ageRange','height','bodyType','portfolioPhotos','portfolioMedia'];
    const updates: any = {};
    for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
    updates.updatedAt = FieldValue.serverTimestamp();
    await firestore().collection('users').doc(req.user!.uid).set(updates, { merge: true });
    if (updates.fullName || updates.displayName) { try { await auth().updateUser(req.user!.uid, { displayName: updates.fullName || updates.displayName }); } catch {} }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const { q, role, limit = 20 } = req.query;
    let query: any = firestore().collection('users').limit(Number(limit));
    if (role) query = query.where('role', '==', role);
    const snap = await query.get();
    let users = snap.docs.map((d: any) => { const data = d.data(); return { id: d.id, displayName: data.displayName || data.fullName || data.name, photoUrl: data.photoUrl || data.photoURL, role: data.role, location: data.location, bio: data.bio, premiumTier: data.premiumTier, verifiedReal: data.verifiedReal }; });
    if (q) { const qs = String(q).toLowerCase(); users = users.filter((u: any) => u.displayName?.toLowerCase().includes(qs) || u.bio?.toLowerCase().includes(qs) || u.location?.toLowerCase().includes(qs)); }
    res.json({ users });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const doc = await firestore().collection('users').doc(req.params.userId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    const d = doc.data()!;
    res.json({ user: { id: doc.id, uid: d.uid, displayName: d.displayName || d.fullName || d.name, fullName: d.fullName, photoUrl: d.photoUrl || d.photoURL, role: d.role, bio: d.bio, location: d.location, isOnline: d.isOnline, lastSeen: d.lastSeen, premiumTier: d.premiumTier, verifiedReal: d.verifiedReal, portfolioPhotos: d.portfolioPhotos, portfolioMedia: d.portfolioMedia, introVideoLink: d.introVideoLink, availabilityStatus: d.availabilityStatus, lookingFor: d.lookingFor, profileTags: d.profileTags, instagramLink: d.instagramLink, youtubeLink: d.youtubeLink, ageRange: d.ageRange, height: d.height, bodyType: d.bodyType, verificationStatus: d.verificationStatus, isApprovedDirector: d.isApprovedDirector } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/follow', async (req: Request, res: Response) => {
  try {
    const { targetUserId, action } = req.body;
    if (!targetUserId || !['follow','unfollow'].includes(action)) return res.status(400).json({ error: 'Invalid request' });
    if (targetUserId === req.user!.uid) return res.status(400).json({ error: 'Cannot follow yourself' });
    const uid = req.user!.uid;
    if (action === 'follow') {
      await firestore().collection('users').doc(uid).collection('following').doc(targetUserId).set({ followedAt: FieldValue.serverTimestamp() });
      await firestore().collection('users').doc(targetUserId).collection('followers').doc(uid).set({ followedAt: FieldValue.serverTimestamp() });
      const ud = await firestore().collection('users').doc(uid).get();
      const nm = ud.data()?.displayName || ud.data()?.fullName || req.user!.email;
      await firestore().collection('notifications').add({ userId: targetUserId, type: 'new_follower', title: '🎬 New Follower!', message: nm + ' started following you', senderId: uid, read: false, createdAt: FieldValue.serverTimestamp() });
      // Send push notification
      sendFollowPush(targetUserId, nm, uid).catch(e => console.error('[follow] push error:', e));
    } else {
      await firestore().collection('users').doc(uid).collection('following').doc(targetUserId).delete();
      await firestore().collection('users').doc(targetUserId).collection('followers').doc(uid).delete();
    }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:userId/followers', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'followers';
    const snap = await firestore().collection('users').doc(req.params.userId).collection(type).get();
    res.json({ users: snap.docs.map(d => d.id) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
