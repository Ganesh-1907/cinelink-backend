import { Router, Response } from 'express';
import VerificationRequest from '../models/VerificationRequest';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Submit a verification request
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await VerificationRequest.findOne({
      userId: req.user!.id,
      status: 'pending',
    });
    if (existing) return res.status(409).json({ error: 'You already have a pending verification request' });

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const request = await VerificationRequest.create({
      userId: req.user!.id,
      fullName: req.body.fullName || user.fullName || '',
      idProofUrl: req.body.idProofUrl || '',
      selfieUrl: req.body.selfieUrl || '',
      status: 'pending',
    });

    res.status(201).json({ request });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Get my verification request status
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const requests = await VerificationRequest.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
