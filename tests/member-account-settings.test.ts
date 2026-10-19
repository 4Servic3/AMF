import { beforeEach, expect, it, vi } from 'vitest';
import { changeMemberPassword, signOutOtherSessions, saveAccessibilityPreferences, saveNotificationPreferences } from '../src/app/app/perfil/account-actions';
import { createClient } from '../src/lib/supabase/server';
import { createServiceRoleClient } from '../src/lib/supabase/service-role';
import { revalidatePath } from 'next/cache';
vi.mock('../src/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../src/lib/supabase/service-role', () => ({ createServiceRoleClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const auth = { getUser: vi.fn(), signInWithPassword: vi.fn(), updateUser: vi.fn(), signOut: vi.fn() };
const query = { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
const account = { id: 'trusted', email: 'trusted@example.test' };
function form(values: Record<string, string>) { const result = new FormData(); Object.entries(values).forEach(([k,v]) => result.set(k,v)); return result; }
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue({ auth } as never);
  vi.mocked(createServiceRoleClient).mockReturnValue({ from: vi.fn().mockReturnValue(query) });
  auth.getUser.mockResolvedValue({ data: { user: account }, error: null });
  auth.signInWithPassword.mockResolvedValue({ data: { user: account }, error: null });
  auth.updateUser.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  query.single.mockResolvedValue({ data: { communication_preferences: { preserved: 'yes', email_notifications: true } }, error: null });
  query.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
});
it('rejects unauthenticated changes before privileged database access', async () => {
  auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  expect((await saveNotificationPreferences(null, form({})))?.error).toBeTruthy();
  expect(createServiceRoleClient).not.toHaveBeenCalled();
  await changeMemberPassword(null, form({}));
  expect(auth.signInWithPassword).not.toHaveBeenCalled();
});
it('cannot change password with incorrect current password', async () => {
  auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
  await changeMemberPassword(null, form({ current: 'wrong', password: 'new-password', confirmation: 'new-password' }));
  expect(auth.updateUser).not.toHaveBeenCalled();
});
it('reauthenticates the server-verified email, ignores client identities and revokes other sessions', async () => {
  await changeMemberPassword(null, form({ email: 'attacker@example.test', current: 'old', password: 'new-password', confirmation: 'new-password' }));
  expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: account.email, password: 'old' });
  expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
});
it('never revokes current session when ending other sessions', async () => {
  await signOutOtherSessions(null, form({}));
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
});
it('persists only validated preferences of authenticated user and preserves unrelated fields', async () => {
  await saveAccessibilityPreferences(null, form({ reduce_motion: 'on', profile_id: 'attacker', role: 'admin' }));
  expect(query.eq).toHaveBeenCalledWith('id', account.id);
  expect(query.update).toHaveBeenCalledWith({ communication_preferences: { preserved: 'yes', email_notifications: true, accessibility: { reduce_motion: true, large_text: false } } });
  expect(revalidatePath).toHaveBeenCalledWith('/app', 'layout');
});
it('rejects malformed boolean input', async () => {
  expect((await saveNotificationPreferences(null, form({ email_notifications: 'false' })))?.error).toBeTruthy();
  expect(query.update).not.toHaveBeenCalled();
});

