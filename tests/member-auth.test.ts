import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recoveryProof, validRecoveryProof, authOrigin, RECOVERY_COOKIE } from '../src/lib/auth/recovery';
import { register, recover, resetPassword } from '../src/app/auth/actions';
import { GET } from '../src/app/auth/callback/route';
import { createClient } from '../src/lib/supabase/server';
import { ensureMemberProfile } from '../src/lib/auth/member-profile';
import { cookies } from 'next/headers';
vi.mock('../src/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../src/lib/auth/member-profile', () => ({ ensureMemberProfile: vi.fn() }));
const user = { id: 'user-1', email: 'user@example.test' };
const token = 'header.' + Buffer.from(JSON.stringify({ amr: [{ method: 'recovery', timestamp: Math.floor(Date.now() / 1000) }] })).toString('base64url') + '.signature';
const jar = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
const auth = {
  signUp: vi.fn(), resetPasswordForEmail: vi.fn(), getUser: vi.fn(), getSession: vi.fn(),
  updateUser: vi.fn(), signOut: vi.fn(), exchangeCodeForSession: vi.fn(),
};
function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('AUTH_RECOVERY_SECRET', 'test-only-recovery-key');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://amf.example.test');
  vi.mocked(createClient).mockResolvedValue({ auth } as never);
  vi.mocked(cookies).mockResolvedValue(jar as never);
  auth.getUser.mockResolvedValue({ data: { user }, error: null });
  auth.getSession.mockResolvedValue({ data: { session: { access_token: token } } });
  auth.updateUser.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
});
describe('recovery proof', () => {
  it('requires signature, current expiry, exact user and exact session', () => {
    const proof = recoveryProof(user.id, token, 1000);
    expect(validRecoveryProof(proof, user.id, token, 2000)).toBe(true);
    expect(validRecoveryProof(proof + 'x', user.id, token, 2000)).toBe(false);
    expect(validRecoveryProof(proof, 'other', token, 2000)).toBe(false);
    expect(validRecoveryProof(proof, user.id, 'other-token', 2000)).toBe(false);
    expect(validRecoveryProof(proof, user.id, token, 901000)).toBe(false);
    expect(validRecoveryProof(undefined, user.id, token)).toBe(false);
  });
  it('rejects production HTTP origins', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://evil.test');
    expect(authOrigin).toThrow();
  });
});
describe('member actions', () => {
  it('does not call signup with invalid input', async () => {
    const state = await register(null, form({ email: user.email, password: 'short', full_name: 'Aluno' }));
    expect(state?.error).toBeTruthy();
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it('only includes name metadata and fixed callback in signup', async () => {
    await register(null, form({ email: user.email, password: 'new-password', full_name: 'Aluno', terms: 'on', role: 'admin', next: 'https://evil.test' }));
    expect(auth.signUp).toHaveBeenCalledWith({
      email: user.email, password: 'new-password',
      options: { data: { full_name: 'Aluno' }, emailRedirectTo: 'https://amf.example.test/auth/callback' },
    });
    expect(ensureMemberProfile).not.toHaveBeenCalled();
  });
  it('uses the same recovery response whether account exists or provider rejects it', async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: 'Not found' } });
    const values = form({ email: user.email });
    expect(await recover(null, values)).toEqual(await recover(null, values));
  });
  it('never updates a password for a regular session without recovery proof', async () => {
    jar.get.mockReturnValue(undefined);
    expect((await resetPassword(null, form({ password: 'new-password', confirmation: 'new-password' })))?.error).toBeTruthy();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it('requires a verified user even with a signed recovery proof', async () => {
    jar.get.mockReturnValue({ value: recoveryProof(user.id, token) });
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Invalid session') });
    await resetPassword(null, form({ password: 'new-password', confirmation: 'new-password' }));
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it('updates password only for recovery session and consumes proof then signs out', async () => {
    jar.get.mockReturnValue({ value: recoveryProof(user.id, token) });
    expect((await resetPassword(null, form({ password: 'new-password', confirmation: 'new-password' })))?.message).toBeTruthy();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    expect(jar.delete).toHaveBeenCalledWith(RECOVERY_COOKIE);
    expect(auth.signOut).toHaveBeenCalled();
  });
});
describe('PKCE callback', () => {
  it('ignores hostile next and type params on non-recovery exchange', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { user, session: { access_token: token }, redirectType: null }, error: null });
    const response = await GET(new Request('https://hostile.test/auth/callback?code=valid&next=https://evil.test&type=recovery'));
    expect(response.headers.get('location')).toBe('https://amf.example.test/app');
    expect(jar.set).not.toHaveBeenCalled();
    expect(ensureMemberProfile).toHaveBeenCalled();
  });
  it('sets a short HttpOnly proof only for confirmed PKCE recovery', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { user, session: { access_token: token }, redirectType: 'recovery' }, error: null });
    const response = await GET(new Request('https://amf.example.test/auth/callback?code=valid'));
    expect(response.headers.get('location')).toBe('https://amf.example.test/redefinir-senha');
    expect(jar.set).toHaveBeenCalledWith(RECOVERY_COOKIE, expect.any(String), expect.objectContaining({ httpOnly: true, maxAge: 900, sameSite: 'lax' }));
  });
  it('rejects missing and invalid codes without creating recovery authorization', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { session: null, user: null }, error: new Error('Expired') });
    const response = await GET(new Request('https://amf.example.test/auth/callback?code=expired'));
    expect(response.headers.get('location')).toBe('https://amf.example.test/recuperar-senha?invalid=1');
    expect(jar.set).not.toHaveBeenCalled();
  });
});




it('does not trust a tampered PKCE recovery marker without a recovery AMR', async () => {
  const passwordToken = 'header.' + Buffer.from(JSON.stringify({ amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }] })).toString('base64url') + '.signature';
  auth.exchangeCodeForSession.mockResolvedValue({ data: { user, session: { access_token: passwordToken }, redirectType: 'recovery' }, error: null });
  const response = await GET(new Request('https://amf.example.test/auth/callback?code=valid'));
  expect(jar.set).not.toHaveBeenCalled();
  expect(response.headers.get('location')).toBe('https://amf.example.test/app');
});
