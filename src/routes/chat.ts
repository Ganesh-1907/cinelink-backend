import { Router, Response } from 'express';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });
    
    const chatId = [req.user!.id, otherUserId].sort().join('_');
    let chat = await Chat.findOne({ chatId });
    
    if (!chat) {
      chat = await Chat.create({
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
    const limit = Number(req.query.limit) || 50;
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: -1 }).limit(limit);
    res.json({ messages: messages.reverse() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:chatId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { text, type = 'text', imageUrl } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    
    const msg = await Message.create({
      chatId: req.params.chatId, type, text: text || '', imageUrl: imageUrl || '',
      senderId: req.user!.id, senderEmail: req.user!.email,
      readBy: [req.user!.id],
    });
    
    const otherId = chat.participants.find(id => id !== req.user!.id);
    chat.lastMessage = type === 'image' ? '📷 Photo' : text;
    chat.lastMessageTime = new Date();
    chat.unreadCount = { ...chat.unreadCount, [otherId || '']: (chat.unreadCount as any)[otherId || ''] + 1 || 1 };
    await chat.save();
    
    if (otherId) {
      await Notification.create({
        userId: otherId, type: 'message', title: '💬 New Message',
        message: `${req.user!.email} sent you a message`,
        senderId: req.user!.id, chatId: req.params.chatId,
      });
    }
    
    res.json({ success: true, messageId: msg._id });
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

export default router;
