import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type AccessState = 'locked' | 'available' | 'expired' | 'coming_soon';
export type Entitlement = {
  profile_id: string;
  resource_id: string;
  resource_type: string;
  starts_at: string | null;
  expires_at: string | null;
  status: string;
};

export function isCurrentGrant(grant: Entitlement, now = Date.now()): boolean {
  return grant.status === 'active' && typeof grant.starts_at === 'string' &&
    Date.parse(grant.starts_at) <= now &&
    (grant.expires_at === null || Date.parse(grant.expires_at) > now);
}

/** Never accept grants belonging to an identity supplied by the caller alone. */
export async function getUserEntitlements(userId: string): Promise<Entitlement[]> {
  if (!userId) return [];
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user || user.id !== userId) return [];
  const { data, error } = await db.from('entitlements')
    .select('profile_id,resource_id,resource_type,status,starts_at,expires_at')
    .eq('profile_id', user.id);
  if (error) throw new Error('Não foi possível consultar seus acessos.');
  return ((data || []) as Entitlement[]).filter((grant) => grant.profile_id === user.id);
}

export function determineAccessState(
  entitlements: Entitlement[], resourceId: string, productStatus = 'active', resourceType = 'product',
): AccessState {
  if (productStatus === 'upcoming') return 'coming_soon';
  if (productStatus !== 'active') return 'locked';
  const grants = entitlements.filter((grant) => grant.resource_id === resourceId && grant.resource_type === resourceType);
  if (grants.some((grant) => isCurrentGrant(grant))) return 'available';
  if (grants.some((grant) => grant.status === 'expired' ||
    (grant.status === 'active' && grant.expires_at !== null && Date.parse(grant.expires_at) <= Date.now()))) return 'expired';
  return 'locked';
}

export async function canAccessProduct(userId: string, productId: string): Promise<boolean> {
  return determineAccessState(await getUserEntitlements(userId), productId) === 'available';
}
