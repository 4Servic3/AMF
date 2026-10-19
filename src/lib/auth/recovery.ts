import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const RECOVERY_COOKIE = 'amf-password-recovery';
export function authOrigin() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://amf-eight.vercel.app');
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && url.hostname === 'localhost')) throw new Error('Origem inválida.');
  return url.origin;
}
function secret() {
  const key = process.env.AUTH_RECOVERY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Recuperação indisponível.');
  return key;
}
function binding(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function recoveryProof(userId: string, token: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ userId, token: binding(token), expires: now + 15 * 60 * 1000 })).toString('base64url');
  return body + '.' + createHmac('sha256', secret()).update(body).digest('base64url');
}
export function validRecoveryProof(value: string | undefined, userId: string, token: string, now = Date.now()) {
  if (!value) return false;
  try {
    const [body, signature, extra] = value.split('.');
    if (!body || !signature || extra) return false;
    const expected = createHmac('sha256', secret()).update(body).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    return data.userId === userId && data.token === binding(token) && Number.isFinite(data.expires) && data.expires > now;
  } catch { return false; }
}


/** Only inspect a token just returned by Supabase's successful code exchange. */
export function hasRecentRecoveryMethod(token: string, now = Date.now()) {
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return Array.isArray(claims.amr) && claims.amr.some((entry: { method?: string; timestamp?: number }) =>
      entry.method === 'recovery' && typeof entry.timestamp === 'number' &&
      entry.timestamp * 1000 <= now + 60000 && entry.timestamp * 1000 > now - 900000);
  } catch { return false; }
}
