import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type ProductRecord = {
  id: string; name: string; description: string | null; type: string; status: string; is_free: boolean;
};
export type ProductResolution =
  | { kind: 'product'; product: ProductRecord }
  | { kind: 'course'; href: string }
  | { kind: 'missing' };

/** Products have UUIDs, not persisted slugs. Only courses have a real slug. */
export async function resolveProductRoute(identifier: string): Promise<ProductResolution> {
  const db = await createClient();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)) {
    const { data, error } = await db.from('products')
      .select('id,name,description,type,status,is_free').eq('id', identifier).eq('status', 'active').maybeSingle();
    if (error) throw new Error('Não foi possível consultar o produto.');
    return data ? { kind: 'product', product: data as ProductRecord } : { kind: 'missing' };
  }
  const { data, error } = await db.from('courses').select('slug')
    .eq('slug', identifier).eq('status', 'published').maybeSingle();
  if (error) throw new Error('Não foi possível consultar o curso.');
  return data?.slug ? { kind: 'course', href: `/app/cursos/${encodeURIComponent(data.slug)}` } : { kind: 'missing' };
}
