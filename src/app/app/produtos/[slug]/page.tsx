import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { gatewayHref } from '@/lib/commerce/gateway';

/**
 * Endereço legado /app/produtos/<slug>. Cursos abrem a própria página; produtos
 * vão para a tela de compra, que mostra "Acessar" a quem já tem o produto.
 */
export default async function ProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const db = await createClient();
  const [course, product] = await Promise.all([
    db.from('courses').select('slug').eq('slug', slug).eq('status', 'published').maybeSingle(),
    db.from('products').select('slug').eq('slug', slug).eq('status', 'active').maybeSingle(),
  ]);
  if (course.data?.slug) redirect(`/app/cursos/${encodeURIComponent(course.data.slug)}`);
  if (product.data?.slug) redirect(gatewayHref({ kind: 'product', slug: product.data.slug }, 'home'));
  notFound();
}
