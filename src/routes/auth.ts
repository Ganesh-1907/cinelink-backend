import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { env } from '../config/env';
import { generateToken } from '../middleware/auth';
import { sendOTPEmail, sendWelcomeEmail } from '../services/emailService';

const router = Router();
const googleClient = new OAuth2Client(env.google.clientId);

// ── Email Signup ──
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: fullName || email.split('@')[0],
      role: 'Actor',
      isOnline: true, lastSeen: new Date(),
    });
    
    const token = generateToken(user);
    sendWelcomeEmail(user.email!, user.fullName!).catch(() => {});
    
    res.status(201).json({ token, user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Email Login ──
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    
    if (user.password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    } else {
      return res.status(401).json({ error: 'Account uses Google Sign-In. Please use Google login.' });
    }
    
    user.isOnline = true; user.lastSeen = new Date(); await user.save();
    const token = generateToken(user);
    
    res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role, photoUrl: user.photoUrl } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Google Sign-In ──
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Google ID token required' });

    const ticket = await googleClient.verifyIdToken({
      idToken, audience: env.google.clientId,
    });
    const payload = ticket.getPayload()!;
    const googleId = payload.sub;
    const email = payload.email!;
    const name = payload.name || email.split('@')[0];
    const photoUrl = payload.picture || '';

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        email, googleId, fullName: name,
        photoUrl, photoURL: photoUrl, role: 'Actor',
        isOnline: true, lastSeen: new Date(),
      });
      sendWelcomeEmail(email, name).catch(() => {});
    } else {
      if (!user.googleId) user.googleId = googleId;
      user.isOnline = true; user.lastSeen = new Date();
      await user.save();
    }
    
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role, photoUrl: user.photoUrl } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Send OTP (email or phone) ──
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in memory with expiry (5 min)
    (global as any).__otps = (global as any).__otps || {};
    (global as any).__otps[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    
    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Verify OTP ──
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    
    const stored = (global as any).__otps?.[email];
    if (!stored) return res.status(400).json({ error: 'No OTP sent to this email' });
    if (Date.now() > stored.expiresAt) return res.status(400).json({ error: 'OTP expired' });
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    
    delete (global as any).__otps[email];
    
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        fullName: email.split('@')[0],
        role: 'Actor',
        isOnline: true, lastSeen: new Date(),
      });
      sendWelcomeEmail(email, user.fullName!).catch(() => {});
    }
    
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role, isNewUser: !user } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Get current user profile ──
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Auth required' });
    const token = authHeader.split(' ')[1];
    const decoded = require('jsonwebtoken').verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e: any) { res.status(401).json({ error: 'Invalid token' }); }
});

export default router;
