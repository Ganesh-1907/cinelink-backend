import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
export function razorpayWebhookMiddleware(req: Request, res: Response, next: NextFunction) {
  const sig = req.headers['x-razorpay-signature'] as string;
  if (!sig) return res.status(400).json({ error: 'Missing signature' });
  const body = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(body).digest('hex');
  if (sig !== expected) return res.status(401).json({ error: 'Invalid signature' });
  if (typeof req.body === 'string') req.body = JSON.parse(req.body);
  next();
}