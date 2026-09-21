import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPlanilhaAccess, PLANILHA_PRODUCT_ID } from '../src/lib/products/planilha-access';
import { createClient } from '../src/lib/supabase/server';

vi.mock('../src/lib/supabase/server', () => ({ createClient: vi.fn() }));

const userId = 'buyer-1';
const currentGrant = () => ({
  profile_id: userId, resource_id: PLANILHA_PRODUCT_ID, resource_type: 'product',
  status: 'active', starts_at: '2020-01-01T00:00:00Z', expires_at: null as string | null,
});

function setup(options: {
  authenticated?: boolean; productStatus?: string; productError?: boolean;
  missingProduct?: boolean; grants?: Record<string, unknown>[]; accessError?: boolean;
} = {}) {
  const product = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.missingProduct ? null : { id: PLANILHA_PRODUCT_ID, status: options.productStatus ?? 'active' },
      error: options.productError ? new Error('Database failure') : null,
    }),
  };
  const grantResult = { data: options.grants ?? [currentGrant()], error: options.accessError ? new Error('Database failure') : null };
  const grants = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    then: (resolve: (value: typeof grantResult) => unknown) => Promise.resolve(grantResult).then(resolve),
  };
  const db = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: options.authenticated === false ? null : { id: userId } }, error: null }) },
    from: vi.fn((table: string) => table === 'products' ? product : grants),
  };
  vi.mocked(createClient).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createClient>>);
  return { db, grants };
}

describe('Planilha product authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated requests before database access', async () => {
    const { db } = setup({ authenticated: false });
    expect((await getPlanilhaAccess()).state).toBe('unauthenticated');
    expect(db.from).not.toHaveBeenCalled();
  });

  it('grants only the current user a current grant to this exact product', async () => {
    const { grants } = setup();
    expect(await getPlanilhaAccess()).toEqual({ state: 'available', userId, productId: PLANILHA_PRODUCT_ID });
    expect(grants.eq).toHaveBeenCalledWith('profile_id', userId);
    expect(grants.eq).toHaveBeenCalledWith('resource_id', PLANILHA_PRODUCT_ID);
    expect(grants.eq).toHaveBeenCalledWith('resource_type', 'product');
  });

  it.each([
    ['other user', { profile_id: 'someone-else' }],
    ['other product', { resource_id: 'another-product' }],
    ['course access', { resource_type: 'course' }],
    ['revoked', { status: 'revoked' }],
    ['expired status', { status: 'expired' }],
    ['expired date', { expires_at: '2020-01-01T00:00:00Z' }],
    ['future start', { starts_at: '2999-01-01T00:00:00Z' }],
    ['invalid start', { starts_at: 'invalid' }],
    ['missing start', { starts_at: null }],
    ['invalid expiry', { expires_at: 'invalid' }],
  ])('rejects %s', async (_name, invalid) => {
    setup({ grants: [{ ...currentGrant(), ...invalid }] });
    expect((await getPlanilhaAccess()).state).toBe('locked');
  });

  it('rejects users without a product grant', async () => {
    setup({ grants: [] });
    expect((await getPlanilhaAccess()).state).toBe('locked');
  });

  it('accepts a current grant even when a historical revoked grant exists', async () => {
    setup({ grants: [{ ...currentGrant(), status: 'revoked' }, currentGrant()] });
    expect((await getPlanilhaAccess()).state).toBe('available');
  });

  it.each([
    { productStatus: 'inactive' }, { missingProduct: true },
    { productError: true }, { accessError: true },
  ])('fails closed for missing, inactive or unavailable records: %j', async (options) => {
    setup(options);
    expect((await getPlanilhaAccess()).state).toBe('unavailable');
  });

  it('fails closed when Supabase initialization fails', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('Configuration unavailable'));
    expect((await getPlanilhaAccess()).state).toBe('unavailable');
  });
});
