import { Router, Request, Response } from 'express';
import { auth, firestore, FieldValue } from '../config/firebase';
import { sendOtp, verifyOtp, resendOtp } from '../config/msg91';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

// ── Send OTP ─────────────────────────────────────────────────────────────────
router.post('/send', rateLimiters.sendOtp, async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    const result = await sendOtp(phone);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to send OTP' });
  }
});

// ── Verify OTP ───────────────────────────────────────────────────────────────
router.post('/verify', rateLimiters.verifyOtp, async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = req.body.otp?.replace(/\D/g, '');

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (!/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const verified = await verifyOtp(phone, otp);
    if (!verified) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const phoneNumber = `+91${phone}`;

    // Check if Firebase user exists with this phone
    let uid: string;
    let isNewUser = false;

    try {
      const existingUser = await auth().getUserByPhoneNumber(phoneNumber);
      uid = existingUser.uid;
    } catch {
      // Create new Firebase user
      const newUser = await auth().createUser({
        phoneNumber,
        displayName: `User_${phone.slice(-4)}`,
      });
      uid = newUser.uid;
      isNewUser = true;

      // Create Firestore user doc
      await firestore().collection('users').doc(uid).set({
        uid,
        phone: phoneNumber,
        role: 'Actor',
        fullName: `User_${phone.slice(-4)}`,
        createdAt: FieldValue.serverTimestamp(),
        isOnline: true,
        lastSeen: FieldValue.serverTimestamp(),
      });
    }

    // Create custom token for client sign-in
    const token = await auth().createCustomToken(uid);

    res.json({ success: true, token, uid, isNewUser });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Verification failed' });
  }
});

// ── Resend OTP ───────────────────────────────────────────────────────────────
router.post('/resend', rateLimiters.sendOtp, async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    const result = await resendOtp(phone);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to resend OTP' });
  }
});

export default router;
