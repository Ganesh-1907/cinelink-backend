import { Router, Response } from 'express';
import User from '../models/User';
import BannedUser from '../models/BannedUser';
import CastingRequest from '../models/CastingRequest';
import Follow from '../models/Follow';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import { sendPushNotification } from '../services/pushService';

const router = Router();
router.use(authMiddleware);

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const followerCount = await Follow.countDocuments({ followingId: req.user!.id });
    const followingCount = await Follow.countDocuments({ followerId: req.user!.id });
    res.json({
      user: {
        ...user.toObject(),
        followerCount,
        followingCount,
      }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const allowedFields = [
      'fullName','displayName','name','bio','role','location',
      'photoUrl','photoURL','introVideoLink','portfolio1','portfolio2','portfolio3',
      'portfolioPhotos','portfolioMedia','availabilityStatus','lookingFor','profileTags',
      'instagramLink','youtubeLink','ageRange','height','bodyType',
      'notificationsEnabled','emailNotifications','profileVisible'
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
    const followerCount = await Follow.countDocuments({ followingId: req.params.userId });
    const followingCount = await Follow.countDocuments({ followerId: req.params.userId });
    res.json({
      user: {
        ...user.toObject(),
        followerCount,
        followingCount,
      }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/follow', async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId || targetUserId === req.user!.id) return res.status(400).json({ error: 'Invalid user' });
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const existing = await Follow.findOne({ followerId: req.user!.id, followingId: targetUserId });
    if (existing) {
      // Unfollow
      await Follow.findByIdAndDelete(existing._id);
      res.json({ success: true, following: false });
    } else {
      // Follow
      await Follow.create({ followerId: req.user!.id, followingId: targetUserId });
      const currentUser = await User.findById(req.user!.id).select('fullName name email');
      const displayName = currentUser?.fullName || currentUser?.name || req.user!.email?.split('@')[0] || 'Someone';
      await Notification.create({
        userId: targetUserId,
        type: 'new_follower',
        title: 'New Follower',
        message: `@${displayName} started following you`,
        senderId: req.user!.id,
      });
      sendPushNotification(targetUserId, 'New Follower', `${displayName} followed you`).catch(() => {});
      res.json({ success: true, following: true });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Check follow status
router.get('/:userId/follow-status', async (req: AuthRequest, res: Response) => {
  try {
    const follow = await Follow.findOne({ followerId: req.user!.id, followingId: req.params.userId });
    res.json({ following: !!follow });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:userId/followers', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    
    const follows = await Follow.find({ followingId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const userIds = follows.map(f => f.followerId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('fullName photoUrl role')
      .lean();

    const total = await Follow.countDocuments({ followingId: req.params.userId });
    res.json({ followers: users, total, page, hasMore: page * limit < total });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:userId/following', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    
    const follows = await Follow.find({ followerId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const userIds = follows.map(f => f.followingId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('fullName photoUrl role')
      .lean();

    const total = await Follow.countDocuments({ followerId: req.params.userId });
    res.json({ following: users, total, page, hasMore: page * limit < total });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Check if current user is banned ──
router.get('/check-ban', async (req: AuthRequest, res: Response) => {
  try {
    const ban = await BannedUser.findOne({ userId: req.user!.id });
    res.json({ banned: !!ban });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Submit casting director request ──
router.post('/casting-request', async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName, yearsExperience, message, experience,
      portfolio, idType, idProofUrl, companyDocUrl, phone, phoneVerified,
    } = req.body;

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const cr = await CastingRequest.create({
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.fullName || user.displayName || user.email,
      role: user.role || 'Director',
      bio: user.bio || '',
      companyName,
      yearsExperience,
      message,
      experience,
      portfolio,
      idType,
      idProofUrl,
      companyDocUrl: companyDocUrl || '',
      phone,
      phoneVerified,
      status: 'pending',
    });

    const admins = await User.find({ isAdmin: true });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id.toString(),
        type: 'casting_request',
        title: '📋 New Casting Director Request!',
        message: `${user.fullName || user.email} (${companyName}) wants to post auditions.`,
        senderId: user._id.toString(),
      });
    }

    res.status(201).json({ request: cr });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Check existing casting request status ──
router.get('/casting-request-status', async (req: AuthRequest, res: Response) => {
  try {
    const cr = await CastingRequest.findOne({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ request: cr, status: cr?.status || null });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Delete account ──
router.delete('/account', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await Promise.all([
      Follow.deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] }),
      Notification.deleteMany({ $or: [{ userId }, { senderId: userId }] }),
      CastingRequest.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'Account deleted.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
