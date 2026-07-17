import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

async function sendOtpViaMsg91(phone: string): Promise<any> {
  const res = await fetch(`https://api.msg91.com/api/v5/otp?authkey=${env.msg91.authKey}&mobile=${phone}&sender=${env.msg91.senderId}&otp_length=4`, {
    method: 'POST',
  });
  return res.json();
}

async function verifyOtpViaMsg91(phone: string, otp: string): Promise<boolean> {
  const res = await fetch(`https://api.msg91.com/api/v5/otp/verify?authkey=${env.msg91.authKey}&mobile=${phone}&otp=${otp}`);
  const data: any = await res.json();
  return data.type === 'success';
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

router.post('/send', rateLimiters.sendOtp, async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' });
    const result = await sendOtpViaMsg91(phone);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message || 'Failed to send OTP' }); }
});

router.post('/verify', rateLimiters.verifyOtp, async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = req.body.otp?.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' });
    if (!/^\d{4,6}$/.test(otp)) return res.status(400).json({ error: 'Invalid OTP' });
    
    const verified = await verifyOtpViaMsg91(phone, otp);
    if (!verified) return res.status(400).json({ error: 'Invalid or expired OTP' });
    
    res.json({ success: true, verified: true, phone: `+91${phone}` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/resend', rateLimiters.sendOtp, async (req: Request, res: Response) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' });
    const result = await sendOtpViaMsg91(phone);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
