import { Router, Request, Response } from 'express';
import { firestore, FieldValue } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';
import { sendChatPush } from '../services/pushService';
const router = Router();
router.use(authMiddleware);

router.post('/start', rateLimiters.sendMessage, async (req: Request, res: Response) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });
    const connSnap = await firestore().collection('connections').where('users', 'array-contains', req.user!.uid).get();
    if (!connSnap.docs.some(d => d.data().users?.includes(otherUserId)) && !req.user!.isAdmin)
      return res.status(403).json({ error: 'Not connected' });
    const chatId = [req.user!.uid, otherUserId].sort().join('_');
    const [myDoc, otherDoc] = await Promise.all([firestore().collection('users').doc(req.user!.uid).get(), firestore().collection('users').doc(otherUserId).get()]);
    const od = otherDoc.data();
    await firestore().collection('chats').doc(chatId).set({ participants: [req.user!.uid, otherUserId], participantNames: [myDoc.data()?.fullName || req.user!.email, od?.fullName || od?.displayName || 'User'], lastMessage: '', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    res.json({ success: true, chatId, otherUser: { uid: otherUserId, displayName: od?.fullName || od?.displayName, photoUrl: od?.photoUrl || od?.photoURL } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const snap = await firestore().collection('chats').where('participants', 'array-contains', req.user!.uid).orderBy('updatedAt', 'desc').get();
    res.json({ chats: snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const chatDoc = await firestore().collection('chats').doc(req.params.chatId).get();
    if (!chatDoc.exists) return res.status(404).json({ error: 'Chat not found' });
    if (!chatDoc.data()!.participants?.includes(req.user!.uid)) return res.status(403).json({ error: 'Not a participant' });
    let q: any = firestore().collection('chats').doc(req.params.chatId).collection('messages').orderBy('createdAt', 'desc').limit(limit);
    if (req.query.startAfter) { const sd = await firestore().collection('chats').doc(req.params.chatId).collection('messages').doc(req.query.startAfter as string).get(); if (sd.exists) q = q.startAfter(sd); }
    const snap = await q.get();
    res.json({ messages: snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).reverse() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:chatId/messages', rateLimiters.sendMessage, async (req: Request, res: Response) => {
  try {
    const { text, type = 'text', imageUrl } = req.body;
    const chatDoc = await firestore().collection('chats').doc(req.params.chatId).get();
    if (!chatDoc.exists) return res.status(404).json({ error: 'Chat not found' });
    const cd = chatDoc.data()!;
    if (!cd.participants?.includes(req.user!.uid)) return res.status(403).json({ error: 'Not a participant' });
    const otherId = cd.participants.find((id: string) => id !== req.user!.uid);
    const msgRef = await firestore().collection('chats').doc(req.params.chatId).collection('messages').add({ type, text: text || '', imageUrl: imageUrl || '', senderId: req.user!.uid, senderEmail: req.user!.email, senderName: req.user!.email, createdAt: FieldValue.serverTimestamp(), readBy: [] });
    await firestore().collection('chats').doc(req.params.chatId).update({ lastMessage: type === 'image' ? '📷 Photo' : text, lastMessageTime: FieldValue.serverTimestamp(), ['unreadCount.' + otherId]: FieldValue.increment(1) });
    if (otherId) { await firestore().collection('notifications').add({ userId: otherId, type: 'message', title: '💬 New Message', message: req.user!.email + ' sent you a message', senderId: req.user!.uid, chatId: req.params.chatId, read: false, createdAt: FieldValue.serverTimestamp() }); }
    res.json({ success: true, messageId: msgRef.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:chatId/messages/:messageId', async (req: Request, res: Response) => {
  try {
    const msgDoc = await firestore().collection('chats').doc(req.params.chatId).collection('messages').doc(req.params.messageId).get();
    if (!msgDoc.exists) return res.status(404).json({ error: 'Message not found' });
    if (msgDoc.data()!.senderId !== req.user!.uid) return res.status(403).json({ error: 'Cannot delete' });
    await firestore().collection('chats').doc(req.params.chatId).collection('messages').doc(req.params.messageId).delete();
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
