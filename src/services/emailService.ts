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

function getEmailTemplate(
  title: string,
  greeting: string,
  bodyText: string,
  otpCode?: string,
  actionBtn?: { text: string; link: string }
): string {
  const currentYear = new Date().getFullYear();
  
  return `
    <div style="background-color: #09090b; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; color: #fafafa;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #111113; border: 1px solid #2e2e32; border-radius: 16px; padding: 32px; text-align: left; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #F5C451; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CineLink</h1>
          <p style="color: #a1a1aa; margin: 4px 0 0 0; font-size: 14px;">Connect. Create. Cast.</p>
        </div>
        
        <div style="height: 1px; background-color: #2e2e32; margin-bottom: 24px;"></div>
        
        <!-- Content -->
        <p style="font-size: 16px; color: #fafafa; margin: 0 0 16px 0; line-height: 1.5; font-weight: 600;">${greeting}</p>
        <p style="font-size: 15px; color: #a1a1aa; margin: 0 0 24px 0; line-height: 1.5;">${bodyText}</p>
        
        <!-- Optional OTP Section -->
        ${otpCode ? `
          <div style="text-align: center; margin: 32px 0; background: rgba(245, 196, 81, 0.08); border: 1px dashed rgba(245, 196, 81, 0.3); border-radius: 12px; padding: 20px;">
            <span style="font-size: 32px; font-weight: 700; color: #F5C451; letter-spacing: 6px; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="font-size: 13px; color: #717178; text-align: center; margin: -16px 0 24px 0;">This OTP will expire in 5 minutes.</p>
        ` : ''}
        
        <!-- Optional Action Button -->
        ${actionBtn ? `
          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionBtn.link}" style="background-color: #F5C451; color: #09090b; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">
              ${actionBtn.text}
            </a>
          </div>
        ` : ''}
        
        <p style="font-size: 13px; color: #717178; margin: 24px 0 0 0; line-height: 1.5; text-align: center;">
          If you did not initiate this request, please ignore this email.
        </p>
        
        <div style="height: 1px; background-color: #2e2e32; margin: 24px 0;"></div>
        
        <!-- Footer -->
        <p style="font-size: 12px; color: #717178; text-align: center; margin: 0;">
          © ${currentYear} CineLink. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

export async function sendOTPEmail(email: string, otp: string) {
  const html = getEmailTemplate(
    'Verify Your Email',
    'Verify your email address',
    'Use the verification code below to complete your registration on CineLink:',
    otp
  );
  return sendEmail(email, 'Verify Your CineLink Email', html);
}

export async function sendResetOTPEmail(email: string, otp: string, name?: string) {
  const html = getEmailTemplate(
    'Reset Password',
    `Hi ${name || 'there'},`,
    'We received a request to reset your password. Use the verification code below to complete the reset process:',
    otp
  );
  return sendEmail(email, 'Reset Your CineLink Password', html);
}

export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const resetLink = `https://cinelink.app/reset-password?token=${token}`;
  const html = getEmailTemplate(
    'Reset Password',
    `Hi ${name || 'there'},`,
    'Click the button below to reset your password. This link is valid for 1 hour.',
    undefined,
    { text: 'Reset Password', link: resetLink }
  );
  return sendEmail(email, 'Reset Your CineLink Password', html);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = getEmailTemplate(
    'Welcome',
    `Welcome to CineLink, ${name}!`,
    'Welcome to India\'s Cinema Network! Start exploring auditions, films, and connect with industry professionals.'
  );
  return sendEmail(email, 'Welcome to CineLink!', html);
}
