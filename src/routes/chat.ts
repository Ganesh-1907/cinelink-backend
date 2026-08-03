import { Router, Response } from 'express';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Notification from '../models/Notification';
import Project from '../models/Project';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/project-chat/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const isCreator = project.createdBy === req.user!.id;
    const isMember = project.members.includes(req.user!.id);
    if (!isCreator && !isMember) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    let chat = await Chat.findOne({ projectId, isGroupChat: true });
    
    const allMemberIds = Array.from(new Set([project.createdBy, ...project.members]));
    const users = await User.find({ _id: { $in: allMemberIds } }).select('fullName displayName email');
    const participantNames = users.map(u => u.fullName || u.displayName || u.email?.split('@')[0] || 'Member');
    
    if (!chat) {
      chat = await Chat.create({
        participants: allMemberIds,
        participantNames,
        isGroupChat: true,
        projectId,
        groupName: project.title,
        lastMessage: 'Group created',
        lastMessageTime: new Date()
      });
    } else {
      let changed = false;
      for (const mId of allMemberIds) {
        if (!chat.participants.includes(mId)) {
          chat.participants.push(mId);
          changed = true;
        }
      }
      if (changed) {
        chat.participantNames = participantNames;
        await chat.save();
      }
    }
    
    res.json({ success: true, chatId: chat._id, chat });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });
    if (otherUserId === req.user!.id) return res.status(400).json({ error: 'Cannot chat with yourself' });

    const otherUser = await User.findById(otherUserId).select('_id');
    if (!otherUser) return res.status(404).json({ error: 'User not found' });
    
    const chatId = [req.user!.id, otherUserId].sort().join('_');
    let chat = await Chat.findOne({ chatId });
    
    if (!chat) {
      chat = await Chat.create({
        chatId,
        participants: [req.user!.id, otherUserId],
        participantNames: [],
        lastMessage: '',
      });
    }
    
    res.json({ success: true, chatId: chat._id, chat });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const chats = await Chat.find({ participants: req.user!.id }).sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:chatId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.participants.includes(req.user!.id)) return res.status(403).json({ error: 'Not a participant' });

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before as string | undefined;

    const query: any = { chatId: req.params.chatId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 }).limit(limit);

    res.json({ messages, hasMore: messages.length === limit });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:chatId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { text, type = 'text', imageUrl } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.participants.includes(req.user!.id)) return res.status(403).json({ error: 'Not a participant' });
    
    const msg = await Message.create({
      chatId: req.params.chatId, type, text: text || '', imageUrl: imageUrl || '',
      senderId: req.user!.id, senderEmail: req.user!.email,
      readBy: [req.user!.id],
    });
    
    chat.lastMessage = type === 'image' ? '📷 Photo' : text;
    chat.lastMessageTime = new Date();
    chat.unreadCount = { ...chat.unreadCount };
    for (const pid of chat.participants) {
      if (pid !== req.user!.id) {
        (chat.unreadCount as any)[pid] = ((chat.unreadCount as any)[pid] || 0) + 1;
      }
    }
    await chat.save();
    
    // Notify offline participants only
    for (const pid of chat.participants) {
      if (pid !== req.user!.id) {
        await Notification.create({
          userId: pid, type: 'message', title: '💬 New Message',
          message: `${req.user!.email} sent you a message`,
          senderId: req.user!.id, chatId: req.params.chatId,
        });
      }
    }
    
    res.json({ success: true, messageId: msg._id, message: msg });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:chatId/read', async (req: AuthRequest, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.participants.includes(req.user!.id)) return res.status(403).json({ error: 'Not a participant' });

    await Message.updateMany(
      { chatId: req.params.chatId, senderId: { $ne: req.user!.id }, readBy: { $ne: req.user!.id } },
      { $addToSet: { readBy: req.user!.id } }
    );
    const u = { ...chat.unreadCount };
    u[req.user!.id!] = 0;
    chat.unreadCount = u;
    await chat.save();
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:chatId/messages/:messageId', async (req: AuthRequest, res: Response) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.senderId !== req.user!.id) return res.status(403).json({ error: 'Cannot delete' });
    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:chatId', async (req: AuthRequest, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.participants.includes(req.user!.id)) return res.status(403).json({ error: 'Not a participant' });

    chat.participants = chat.participants.filter(p => p !== req.user!.id);
    if (chat.participants.length === 0) {
      await chat.deleteOne();
    } else {
      await chat.save();
    }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
