import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: { user: env.smtp.user, pass: env.smtp.password },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"CineLink" <${env.smtp.user}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (e) {
    console.error('[Email] Failed:', e);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string) {
  return sendEmail(email, 'Your CineLink OTP',
    `<p>Your OTP is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`);
}

export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const resetLink = `https://cinelink.app/reset-password?token=${token}`;
  return sendEmail(email, 'Reset Your CineLink Password',
    `<p>Hi ${name || 'there'},</p>
     <p>Click the link below to reset your password:</p>
     <p><a href="${resetLink}" style="background:#C9956C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a></p>
     <p>This link expires in 1 hour.</p>
     <p>If you didn't request this, ignore this email.</p>`);
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail(email, 'Welcome to CineLink!',
    `<p>Hi ${name},</p><p>Welcome to India's Cinema Network! Start exploring auditions, films, and connect with industry professionals.</p>`);
}
