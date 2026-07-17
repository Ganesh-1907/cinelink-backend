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

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail(email, 'Welcome to CineLink!',
    `<p>Hi ${name},</p><p>Welcome to India's Cinema Network! Start exploring auditions, films, and connect with industry professionals.</p>`);
}
