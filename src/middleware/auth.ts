import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: { id: string; email?: string; role?: string; isAdmin: boolean; };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, isAdmin: decoded.isAdmin === true };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

export function generateToken(user: any): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role, isAdmin: user.isAdmin },
    env.jwtSecret,
    { expiresIn: parseInt(env.jwtExpiresIn.replace('d', '')) * 86400 } as jwt.SignOptions
  );
}
