import { Router, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/sign-cloudinary', (req: AuthRequest, res: Response) => {
  const { type } = req.body;
  const apiKey = env.cloudinary.apiKey;
  const apiSecret = env.cloudinary.apiSecret;
  const cloudName = env.cloudinary.cloudName;

  if (!apiKey || !apiSecret || !cloudName) {
    return res.status(503).json({ error: 'Cloudinary not configured' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { timestamp, source: 'uw' };
  if (type === 'image') params.allowed_formats = 'jpg,jpeg,png,gif,webp';
  else params.allowed_formats = 'mp4,mov,avi,mkv,webm';

  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

  res.json({ signature, timestamp, apiKey });
});

export default router;
