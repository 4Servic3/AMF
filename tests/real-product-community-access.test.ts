import { beforeEach, describe, expect, it, vi } from 'vitest';
import { determineAccessState, getUserEntitlements, type Entitlement } from '../src/lib/services/access';
import { getCommunityAccess, isSafeCommunityUrl } from '../src/lib/services/community-access';
import { resolveProductRoute } from '../src/lib/services/product-route';
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
describe('product route resolves real records', () => {
  it('returns missing for nonexistent course slug without querying a fictional product slug', async () => {
    const { db, query } = mockDb(null);
    expect(await resolveProductRoute('academia-completa')).toEqual({ kind: 'missing' });
    expect(db.from).toHaveBeenCalledWith('courses');
    expect(query.eq).toHaveBeenCalledWith('status', 'published');
  });
  it('encodes course redirects so a returned slug cannot change the destination origin', async () => {
    mockDb({ slug: '//evil.com/x?admin=1' });
    expect(await resolveProductRoute('course')).toEqual({ kind: 'course', href: '/app/cursos/%2F%2Fevil.com%2Fx%3Fadmin%3D1' });
  });
  it('queries products by UUID and active status', async () => {
    const id = 'f6748b06-8efa-4dc6-a28f-96a17d14b7fd';
    const product = { id, name: 'Product', status: 'active', is_free: false };
    const { db, query } = mockDb(product);
    expect(await resolveProductRoute(id)).toEqual({ kind: 'product', product });
    expect(db.from).toHaveBeenCalledWith('products');
    expect(query.eq).toHaveBeenCalledWith('id', id);
    expect(query.eq).toHaveBeenCalledWith('status', 'active');
  });
});

describe('published configured community groups', () => {
  function configureGroup(destination: string | null) {
    mockDb([{ ...grant, resource_type: 'course', resource_id: 'course-id' }]);
    const results: Record<string, unknown[]> = {
      lessons: [{ id: 'lesson-id', title: 'Grupo real', external_resource_id: 'resource-id', course_modules: { course_id: 'course-id', courses: { slug: 'course-slug' } } }],
      external_resources: destination === null ? [] : [{ id: 'resource-id', private_destination_url: destination }],
    };
    const admin = { from: vi.fn((table: string) => {
      const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data: results[table], error: null }).then(resolve) };
      return query;
    }) };
    vi.mocked(createServiceRoleClient).mockReturnValue(admin as unknown as ReturnType<typeof createServiceRoleClient>);
  }
  it('returns only an internal protected destination for the authorized course', async () => {
    configureGroup('https://chat.whatsapp.com/private-invite');
    const result = await getCommunityAccess();
    expect(result).toEqual({ state: 'available', links: [{ id: 'lesson-id', title: 'Grupo real', href: '/api/courses/course-slug/lesson/lesson-id/whatsapp' }] });
    expect(JSON.stringify(result)).not.toContain('private-invite');
  });
  it.each([null, 'javascript:alert(1)'])('does not expose unavailable or unsafe configured groups %s', async (destination) => {
    configureGroup(destination);
    expect(await getCommunityAccess()).toEqual({ state: 'unavailable', links: [] });
  });
});
