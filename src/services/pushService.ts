import admin from 'firebase-admin';
import User from '../models/User';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      // Try default credentials (works on some hosting platforms)
      admin.initializeApp();
    }
  } catch {
    console.warn('[Push] Firebase Admin not configured — push notifications disabled');
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user?.fcmToken) return false;

    if (!admin.apps.length || !admin.messaging) return false;

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: { title, body },
      data: data || {},
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    await admin.messaging().send(message);
    return true;
  } catch (e: any) {
    console.error('[Push] Failed:', e.message);
    // If token is invalid/unregistered, clear it
    if (e.code === 'messaging/invalid-registration-token' ||
        e.code === 'messaging/registration-token-not-registered') {
      await User.findByIdAndUpdate(userId, { fcmToken: '' });
    }
    return false;
  }
}
