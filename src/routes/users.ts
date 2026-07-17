import { Router, Response } from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import { sendPushNotification } from '../services/pushService';

const router = Router();
router.use(authMiddleware);

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const allowedFields = [
      'fullName','displayName','name','bio','role','location',
      'photoUrl','photoURL','introVideoLink','portfolio1','portfolio2','portfolio3',
      'portfolioPhotos','portfolioMedia','availabilityStatus','lookingFor','profileTags',
      'instagramLink','youtubeLink','ageRange','height','bodyType'
    ];
    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    updates.updatedAt = new Date();
    const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true }).select('-password');
    res.json({ user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { query, role, limit } = req.query;
    const filter: any = {};
    if (role && role !== 'All') filter.role = role;
    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').limit(Math.min(Number(limit) || 50, 100));
    res.json({ users });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email -phone -fcmToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/follow', async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId || targetUserId === req.user!.id) return res.status(400).json({ error: 'Invalid user' });
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Toggle follow in memory (simplified - in production use a Follow collection)
    const [myFollowing, targetFollowers] = await Promise.all([
      User.findById(req.user!.id).select('portfolio1'),
      User.findById(targetUserId).select('portfolio1'),
    ]);

    // Create notification
    await Notification.create({
      userId: targetUserId,
      type: 'new_follower',
      title: 'New Follower',
      message: `${req.user!.email} started following you`,
      senderId: req.user!.id,
    });

    sendPushNotification(targetUserId, 'New Follower', `${req.user!.email} followed you`).catch(() => {});
    res.json({ success: true, following: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:userId/followers', async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string || 'followers';
    // Simplified - returns user data
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ [type]: [] });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
