import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: { user: env.smtp.user, pass: env.smtp.password },
  connectionTimeout: 10000, // 10s
  greetingTimeout: 10000, // 10s
  socketTimeout: 10000, // 10s
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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #08080a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #08080a; padding: 40px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #121216; border: 1px solid #232329; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
              <!-- Top Gradient Accent Bar -->
              <tr>
                <td height="5" style="background: linear-gradient(90deg, #F5C451 0%, #C9956C 100%);"></td>
              </tr>
              <tr>
                <td style="padding: 40px 32px 32px 32px;">
                  <!-- Logo / Brand Header -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <!-- CineLink Golden Emblem Badge -->
                        <table border="0" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 196, 81, 0.08); border: 2px solid #F5C451; border-radius: 50%; width: 64px; height: 64px; text-align: center; margin-bottom: 12px;">
                          <tr>
                            <td align="center" style="vertical-align: middle; font-size: 32px; color: #F5C451; font-weight: bold; line-height: 64px; padding: 0;">
                              🎬
                            </td>
                          </tr>
                        </table>
                        <h1 style="color: #F5C451; font-size: 24px; font-weight: 800; margin: 0 0 2px 0; letter-spacing: 1px; text-align: center; text-transform: uppercase;">CineLink</h1>
                        <p style="color: #8E8E93; font-size: 11px; margin: 0; letter-spacing: 2px; text-transform: uppercase; text-align: center;">India's Cinema Network</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                      <td height="1" style="background-color: #232329;"></td>
                    </tr>
                  </table>

                  <!-- Content Body -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="color: #FFFFFF; font-size: 17px; font-weight: 700; line-height: 1.4;">
                        ${greeting}
                      </td>
                    </tr>
                    <tr>
                      <td height="8"></td>
                    </tr>
                    <tr>
                      <td style="color: #A1A1AA; font-size: 14px; line-height: 1.6;">
                        ${bodyText}
                      </td>
                    </tr>
                  </table>

                  <!-- Optional OTP Code Presentation -->
                  ${otpCode ? `
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; margin-bottom: 28px;">
                    <tr>
                      <td align="center" style="background-color: rgba(245, 196, 81, 0.05); border: 1px dashed rgba(245, 196, 81, 0.35); border-radius: 12px; padding: 20px; text-align: center;">
                        <p style="color: #8E8E93; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px 0;">Your Verification Code</p>
                        <span style="font-size: 36px; font-weight: 800; color: #F5C451; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 0 10px rgba(245, 196, 81, 0.2);">${otpCode}</span>
                        <p style="color: #71717A; font-size: 12px; margin: 10px 0 0 0;">Valid for 5 minutes. Do not share this code.</p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- Optional Action Button -->
                  ${actionBtn ? `
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; margin-bottom: 28px; text-align: center;">
                    <tr>
                      <td align="center">
                        <a href="${actionBtn.link}" style="background: linear-gradient(90deg, #F5C451 0%, #C9956C 100%); color: #08080a; padding: 12px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(245, 196, 81, 0.2);">
                          ${actionBtn.text}
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- Divider -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; margin-bottom: 20px;">
                    <tr>
                      <td height="1" style="background-color: #232329;"></td>
                    </tr>
                  </table>

                  <!-- Footer Section -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
                    <tr>
                      <td style="color: #71717A; font-size: 11px; line-height: 1.5; text-align: center;">
                        If you did not make this request, you can safely ignore this email.
                      </td>
                    </tr>
                    <tr>
                      <td height="12"></td>
                    </tr>
                    <tr>
                      <td style="color: #52525B; font-size: 10px; text-align: center; line-height: 1.4;">
                        © ${currentYear} CineLink. All rights reserved. <br>
                        India's Professional Cinema & Casting Network.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
