import { Router, Response } from 'express';
import multer from 'multer';
import User from '../models/User';
import { uploadToR2 } from '../services/r2Service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

interface UploadRequest extends AuthRequest {
  file?: Express.Multer.File;
}

const router = Router();
router.use(authMiddleware);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Upload image to R2
router.post('/r2-image', upload.single('file'), async (req: UploadRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const key = `uploads/${req.user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const url = await uploadToR2(key, req.file.buffer, req.file.mimetype);
    res.json({ secureUrl: url });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Upload video to R2
router.post('/r2-video', upload.single('file'), async (req: UploadRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const ext = req.file.mimetype.split('/')[1] || 'mp4';
    const key = `uploads/${req.user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const url = await uploadToR2(key, req.file.buffer, req.file.mimetype);
    res.json({ secureUrl: url });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Save FCM notification token
router.post('/notification-token', async (req: AuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    await User.findByIdAndUpdate(req.user!.id, { fcmToken: token, platform: platform || 'unknown' });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
