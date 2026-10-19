import { beforeEach, expect, it, vi } from 'vitest';
import { ensureMemberProfile } from '../src/lib/auth/member-profile';
import { createClient } from '../src/lib/supabase/server';
import { createServiceRoleClient } from '../src/lib/supabase/service-role';
vi.mock('../src/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../src/lib/supabase/service-role', () => ({ createServiceRoleClient: vi.fn() }));
const upsert = vi.fn(), getUser = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue({ auth: { getUser } } as never);
  vi.mocked(createServiceRoleClient).mockReturnValue({ from: vi.fn().mockReturnValue({ upsert }) });
  upsert.mockResolvedValue({ error: null });
});
it('refuses unauthenticated profile creation before service role access', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(ensureMemberProfile()).rejects.toThrow();
  expect(createServiceRoleClient).not.toHaveBeenCalled();
});
it('ignores attacker metadata roles and preserves existing profile fields', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'trusted-user', email: 'account@example.test', user_metadata: { full_name: 'Nome', role: 'admin', email: 'other@example.test', id: 'other' } } }, error: null });
  await ensureMemberProfile();
  expect(upsert).toHaveBeenCalledWith({ id: 'trusted-user', email: 'account@example.test', full_name: 'Nome' }, { onConflict: 'id', ignoreDuplicates: true });
});
it('reports persistence failure', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'trusted-user', email: 'account@example.test' } }, error: null });
  upsert.mockResolvedValue({ error: { code: '23502' } });
  await expect(ensureMemberProfile()).rejects.toThrow('perfil');
});

