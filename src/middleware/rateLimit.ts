import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, CLEANUP_INTERVAL);

function rateLimit(opts: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${opts.keyPrefix}:${req.user?.uid || req.ip}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (entry.count >= opts.max) {
      return res.status(429).json({
        error: opts.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    entry.count++;
    next();
  };
}

export const rateLimiters = {
  createPost: rateLimit({
    windowMs: 60_000,
    max: 5,
    keyPrefix: 'createPost',
    message: 'Too many posts. Please wait before posting again.',
  }),
  sendMessage: rateLimit({
    windowMs: 10_000,
    max: 30,
    keyPrefix: 'sendMessage',
    message: 'Too many messages. Slow down.',
  }),
  createAudition: rateLimit({
    windowMs: 86_400_000,
    max: 3,
    keyPrefix: 'createAudition',
    message: 'Maximum 3 auditions per day.',
  }),
  createFilm: rateLimit({
    windowMs: 86_400_000,
    max: 2,
    keyPrefix: 'createFilm',
    message: 'Maximum 2 film uploads per day.',
  }),
  createContest: rateLimit({
    windowMs: 86_400_000,
    max: 2,
    keyPrefix: 'createContest',
    message: 'Maximum 2 contests per day.',
  }),
  follow: rateLimit({
    windowMs: 3600_000,
    max: 50,
    keyPrefix: 'follow',
    message: 'Too many follow actions. Try again later.',
  }),
  sendOtp: rateLimit({
    windowMs: 60_000,
    max: 3,
    keyPrefix: 'sendOtp',
    message: 'Too many OTP requests. Wait a minute.',
  }),
  verifyOtp: rateLimit({
    windowMs: 60_000,
    max: 5,
    keyPrefix: 'verifyOtp',
    message: 'Too many verification attempts. Wait a minute.',
  }),
  apiGeneral: rateLimit({
    windowMs: 60_000,
    max: 100,
    keyPrefix: 'api',
    message: 'Too many requests. Rate limit exceeded.',
  }),
};
