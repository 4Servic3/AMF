import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getMemberAccess } from '@/lib/access/member-access';
import { checkoutLink, formatPrice, PRODUCT_SLUGS, type GatewayTarget } from './gateway';

export type GatewayOffer = {
  name: string;
  description: string | null;
  price: string | null;
  checkoutUrl: string | null;
  owned: boolean;
  /** Para onde levar quem já tem acesso. */
  accessHref: string;
};

type ProductRow = { id: string; name: string; description: string | null; type: string; slug: string | null; checkout_url: string | null; status: string; product_prices?: { amount: number; interval: string | null; active: boolean }[] | null };

/** Enquanto o produto não tiver link de pagamento cadastrado no admin. */
const PLACEHOLDER_CHECKOUT = '/checkout';

const PRODUCT_COLUMNS = 'id,name,description,type,slug,checkout_url,status,product_prices(amount,interval,active)';

function accessHrefFor(product: ProductRow, courseSlug: string | null): string {
  if (courseSlug) return `/app/cursos/${encodeURIComponent(courseSlug)}`;
  if (product.slug === PRODUCT_SLUGS.planilha) return '/app/produtos/planilha-doses-seguras-felinos/calculadora';
  if (product.slug === PRODUCT_SLUGS.casos) return '/app/casos';
  return '/app';
}

/** Resolve o produto à venda para a tela de compra. `null` = não existe ou não está à venda. */
export async function loadGatewayOffer(target: GatewayTarget): Promise<GatewayOffer | null> {
  const db = await createClient();
  let product: ProductRow | null = null;
  let course: { id: string; slug: string } | null = null;

  if (target.kind === 'course') {
    const { data, error } = await db.from('courses').select('id,slug,title,short_description,product_id').eq('slug', target.slug).eq('status', 'published').maybeSingle();
    if (error) throw new Error('Não foi possível carregar a oferta.');
    if (!data) return null;
    course = { id: data.id, slug: data.slug };
    if (data.product_id) {
      const result = await db.from('products').select(PRODUCT_COLUMNS).eq('id', data.product_id).eq('status', 'active').maybeSingle();
      if (result.error) throw new Error('Não foi possível carregar a oferta.');
      product = result.data as ProductRow | null;
    }
    // Curso publicado sem produto vinculado: mostra a oferta, sem link de pagamento.
    product ??= { id: data.id, name: data.title, description: data.short_description, type: 'course', slug: null, checkout_url: null, status: 'active' };
  } else {
    const result = await db.from('products').select(PRODUCT_COLUMNS).eq('slug', target.slug).eq('status', 'active').maybeSingle();
    if (result.error) throw new Error('Não foi possível carregar a oferta.');
    product = result.data as ProductRow | null;
    if (!product) return null;
    if (product.type === 'course') {
      const linked = await db.from('courses').select('id,slug').eq('product_id', product.id).eq('status', 'published').maybeSingle();
      if (linked.error) throw new Error('Não foi possível carregar a oferta.');
      course = linked.data;
    }
  }

  const access = await getMemberAccess();
  const owned = course ? access.courseIds.has(course.id)
    : product.slug === PRODUCT_SLUGS.casos ? access.hasCasesAccess
    : access.productIds.has(product.id);
  const price = (product.product_prices || []).find(p => p.active);
  let email: string | null = null;
  if (!owned) {
    const { data } = await db.auth.getUser();
    email = data.user?.email ?? null;
  }
  return {
    name: product.name,
    description: product.description,
    price: formatPrice(price?.amount, price?.interval),
    checkoutUrl: owned ? null : checkoutLink(product.checkout_url, email) ?? PLACEHOLDER_CHECKOUT,
    owned,
    accessHref: accessHrefFor(product, course?.slug ?? null),
  };
}
