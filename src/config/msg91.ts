import { env } from './env';

export const msg91Config = {
  authKey: env.msg91.authKey,
  senderId: env.msg91.senderId,
};

export const MSG91_API_BASE = 'https://api.msg91.com/api/v5';

interface Msg91Response {
  type: string;
  message: string;
}

async function parseResponse(res: Response): Promise<Msg91Response> {
  const data = (await res.json()) as Msg91Response;
  return data;
}

export async function sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
  const mobile = `91${phone.replace(/\D/g, '')}`;
  const res = await fetch(`${MSG91_API_BASE}/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authkey: msg91Config.authKey,
      mobile,
      sender: msg91Config.senderId,
      otp_expiry: 10,
    }),
  });
  const data = await parseResponse(res);
  if (data.type === 'success') return { success: true, message: 'OTP sent' };
  throw new Error(data.message || 'Failed to send OTP');
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const mobile = `91${phone.replace(/\D/g, '')}`;
  const res = await fetch(`${MSG91_API_BASE}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authkey: msg91Config.authKey,
      mobile,
      otp,
    }),
  });
  const data = await parseResponse(res);
  return data.type === 'success';
}

export async function resendOtp(phone: string): Promise<{ success: boolean; message: string }> {
  const mobile = `91${phone.replace(/\D/g, '')}`;
  const res = await fetch(`${MSG91_API_BASE}/otp/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authkey: msg91Config.authKey,
      mobile,
      retrytype: 'text',
    }),
  });
  const data = await parseResponse(res);
  if (data.type === 'success') return { success: true, message: 'OTP resent' };
  throw new Error(data.message || 'Failed to resend OTP');
}
