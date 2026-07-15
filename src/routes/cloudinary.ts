import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth';

const router = Router();

interface CloudinarySignRequest {
  type: 'image' | 'video';
  publicId?: string;
  folder?: string;
}

router.post('/sign-cloudinary', authMiddleware, (req: Request, res: Response) => {
  const { type, publicId, folder } = req.body as CloudinarySignRequest;

  const apiKey = env.cloudinary.apiKey;
  const apiSecret = env.cloudinary.apiSecret;
  const cloudName = env.cloudinary.cloudName;

  if (!apiKey || !apiSecret || !cloudName) {
    return res.status(503).json({ error: 'Cloudinary not configured on server' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = {
    timestamp,
    source: 'uw',
    upload_preset: 'signed_upload',
  };

  if (publicId) params.public_id = publicId as string;
  if (folder) params.folder = folder as string;
  if (type === 'image') params.allowed_formats = 'jpg,jpeg,png,gif,webp';
  else params.allowed_formats = 'mp4,mov,avi,mkv,webm';

  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

  res.json({ signature, timestamp, apiKey });
});

export default router;
