import Razorpay from 'razorpay';
import { env } from './env';
let rzp: Razorpay | null = null;
export function getRazorpay(): Razorpay {
  if (!rzp) rzp = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return rzp;
}
export const TIER_PLAN_IDS: Record<string, string> = {
  spotlight: 'plan_T79TclEwk342h5', marquee: 'plan_T79YHTe84YkAZt',
  premiere: 'plan_T79Yu7hDIJWKKO', premiereElite: 'plan_T79Zlz9XoAR9lt',
  black: 'plan_black_placeholder',
};
export const TIER_CONFIG: Record<string, { price: number; durationMonths: number; name: string }> = {
  spotlight: { price: 29900, durationMonths: 1, name: 'Spotlight' },
  marquee: { price: 69900, durationMonths: 3, name: 'Marquee' },
  premiere: { price: 129900, durationMonths: 6, name: 'Premiere' },
  premiereElite: { price: 249900, durationMonths: 12, name: 'Premiere Elite' },
  black: { price: 499900, durationMonths: 0, name: 'Black' },
};