import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, CLEANUP_INTERVAL);

function rateLimit(opts: { windowMs: number; max: number; keyPrefix: string; message?: string }) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const key = `${opts.keyPrefix}:${req.user?.id || req.ip}`;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    if (entry.count >= opts.max) {
      return res.status(429).json({
        error: opts.message || 'Too many requests.',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }
    entry.count++;
    next();
  };
}

export const rateLimiters = {
  createPost: rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'createPost' }),
  sendMessage: rateLimit({ windowMs: 10_000, max: 30, keyPrefix: 'sendMessage' }),
  createAudition: rateLimit({ windowMs: 86_400_000, max: 3, keyPrefix: 'createAudition' }),
  createFilm: rateLimit({ windowMs: 86_400_000, max: 2, keyPrefix: 'createFilm' }),
  createContest: rateLimit({ windowMs: 86_400_000, max: 2, keyPrefix: 'createContest' }),
  follow: rateLimit({ windowMs: 3600_000, max: 50, keyPrefix: 'follow' }),
  sendOtp: rateLimit({ windowMs: 60_000, max: 3, keyPrefix: 'sendOtp' }),
  verifyOtp: rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'verifyOtp' }),
  apiGeneral: rateLimit({ windowMs: 60_000, max: 100, keyPrefix: 'api' }),
};
