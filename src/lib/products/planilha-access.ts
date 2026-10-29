import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/auth-user';

export const PLANILHA_PRODUCT_ID = 'f6748b06-8efa-4dc6-a28f-96a17d14b7fd';
export const PLANILHA_PRODUCT_SLUG = 'planilha-doses-seguras-felinos';

export type PlanilhaAccess =
  | { state: 'unauthenticated'; userId: null; productId: string }
  | { state: 'locked' | 'available'; userId: string; productId: string }
  | { state: 'unavailable'; userId: string | null; productId: string };

/** Check the current authenticated user's product grant on every protected request. */
export async function getPlanilhaAccess(): Promise<PlanilhaAccess> {
  let userId: string | null = null;
  const productId = PLANILHA_PRODUCT_ID;
  try {
    const db = await createClient();
    const { data: { user }, error: authError } = await getAuthUser();
    if (authError || !user) return { state: 'unauthenticated', userId: null, productId };
    userId = user.id;

    const [{ data: product, error: productError }, { data: entitlements, error: accessError }] = await Promise.all([
      db.from('products').select('id,status').eq('id', productId).maybeSingle(),
      db.from('entitlements')
        .select('profile_id,resource_id,resource_type,status,starts_at,expires_at')
        .eq('profile_id', userId).eq('resource_id', productId)
        .eq('resource_type', 'product').eq('status', 'active'),
    ]);
    if (productError || !product || product.status !== 'active') {
      return { state: 'unavailable', userId, productId };
    }
    if (accessError || !entitlements) return { state: 'unavailable', userId, productId };

    const now = Date.now();
    const available = entitlements.some((grant) =>
      grant.profile_id === userId && grant.resource_id === productId &&
      grant.resource_type === 'product' && grant.status === 'active' &&
      typeof grant.starts_at === 'string' && Date.parse(grant.starts_at) <= now &&
      (grant.expires_at === null ||
        (typeof grant.expires_at === 'string' && Date.parse(grant.expires_at) > now)),
    );
    return { state: available ? 'available' : 'locked', userId, productId };
  } catch {
    // Configuration, network and database failures must never grant access.
    return { state: 'unavailable', userId, productId };
  }
}
