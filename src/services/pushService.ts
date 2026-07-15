import { firestore, messaging } from '../config/firebase';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  userId: string;
}

export async function sendPush({ title, body, data, userId }: PushPayload): Promise<boolean> {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return false;

    await messaging().sendEachForMulticast({
      tokens: [fcmToken],
      notification: { title, body },
      data: data || {},
      android: { priority: 'high', ttl: 86400000 },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    return true;
  } catch (err) {
    console.error('[PushService] Error sending push:', err);
    return false;
  }
}

export async function sendChatPush(
  otherUserId: string,
  senderName: string,
  text: string,
  chatId: string,
): Promise<void> {
  await sendPush({
    userId: otherUserId,
    title: '💬 New Message',
    body: `${senderName}: ${text}`,
    data: { type: 'message', chatId, senderId: '' },
  });
}

export async function sendFollowPush(
  targetUserId: string,
  followerName: string,
  followerId: string,
): Promise<void> {
  await sendPush({
    userId: targetUserId,
    title: '👥 New Follower',
    body: `${followerName} started following you`,
    data: { type: 'new_follower', senderId: followerId },
  });
}
