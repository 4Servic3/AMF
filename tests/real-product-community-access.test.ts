import { beforeEach, describe, expect, it, vi } from 'vitest';
import { determineAccessState, getUserEntitlements, type Entitlement } from '../src/lib/services/access';
import { getCommunityAccess, isSafeCommunityUrl } from '../src/lib/services/community-access';
import { createClient } from '../src/lib/supabase/server';
import { createServiceRoleClient } from '../src/lib/supabase/service-role';
vi.mock('../src/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../src/lib/supabase/service-role', () => ({ createServiceRoleClient: vi.fn() }));

const grant: Entitlement = { profile_id: 'user', resource_id: 'product', resource_type: 'product', status: 'active', starts_at: '2020-01-01T00:00:00Z', expires_at: null };
function mockDb(data: unknown = [], user: { id: string } | null = { id: 'user' }) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }), then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve) };
  const db = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from: vi.fn().mockReturnValue(query) };
  vi.mocked(createClient).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createClient>>);
  return { db, query };
}
beforeEach(() => vi.clearAllMocks());
describe('real product and community grants', () => {
  it('rejects anonymous and spoofed users before querying grants', async () => {
    const anonymous = mockDb([grant], null);
    expect(await getUserEntitlements('user')).toEqual([]);
    expect(anonymous.db.from).not.toHaveBeenCalled();
    const spoofed = mockDb([grant]);
    expect(await getUserEntitlements('other-user')).toEqual([]);
    expect(spoofed.db.from).not.toHaveBeenCalled();
  });
  it('loads only the authenticated user grants', async () => {
    const { query } = mockDb([grant, { ...grant, profile_id: 'other' }]);
    expect(await getUserEntitlements('user')).toEqual([grant]);
    expect(query.eq).toHaveBeenCalledWith('profile_id', 'user');
  });
  it.each([
    { status: 'revoked' }, { resource_id: 'other' }, { resource_type: 'course' },
    { starts_at: '2999-01-01' }, { starts_at: 'invalid' }, { starts_at: null }, { expires_at: 'invalid' },
  ])('rejects incompatible grants %j', (patch) => {
    expect(determineAccessState([{ ...grant, ...patch }], 'product')).toBe('locked');
  });
  it('distinguishes missing and expired grants and accepts valid renewal', () => {
    const expired = { ...grant, expires_at: '2020-01-01' };
    expect(determineAccessState([], 'product')).toBe('locked');
    expect(determineAccessState([expired], 'product')).toBe('expired');
    expect(determineAccessState([expired, grant], 'product')).toBe('available');
    expect(determineAccessState([grant], 'product', 'inactive')).toBe('locked');
  });
  it('does not read private group configuration for anonymous users', async () => {
    mockDb([], null);
    expect(await getCommunityAccess()).toEqual({ state: 'unauthenticated', links: [] });
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });
  it('does not read private group configuration without an explicit current course grant', async () => {
    mockDb([grant, { ...grant, resource_type: 'course', expires_at: '2020-01-01' }]);
    expect(await getCommunityAccess()).toEqual({ state: 'locked', links: [] });
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });
  it.each(['javascript:alert(1)', 'http://chat.whatsapp.com/abc', 'https://chat.whatsapp.com.evil.com/abc', 'https://attacker@chat.whatsapp.com/abc', 'https://chat.whatsapp.com:444/abc', 'https://chat.whatsapp.com/', 'invalid'])('rejects unsafe community destination %s', (url) => {
    expect(isSafeCommunityUrl(url)).toBe(false);
  });
  it('accepts an HTTPS WhatsApp invitation', () => expect(isSafeCommunityUrl('https://chat.whatsapp.com/invite')).toBe(true));
});
