import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { env } from '../config/env';
declare global { namespace Express { interface Request { user?: { uid: string; email: string; isAdmin: boolean } } } }
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const dt = await auth().verifyIdToken(h.split('Bearer ')[1]);
    const ud = await firestore().collection('users').doc(dt.uid).get();
    const d = ud.data();
    req.user = { uid: dt.uid, email: dt.email || '', isAdmin: dt.email === env.adminEmail || d?.isAdmin === true };
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}