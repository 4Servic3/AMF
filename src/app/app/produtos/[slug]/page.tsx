import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { determineAccessState, getUserEntitlements } from '@/lib/services/access';
import { resolveProductRoute } from '@/lib/services/product-route';
import { trackEvent } from '@/lib/services/analytics';

export default async function ProductDetails({ params }: { params: Promise<{ slug: string }> }) {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) redirect('/entrar');
  const { slug } = await params;
  const result = await resolveProductRoute(slug);
  if (result.kind === 'missing') notFound();
  if (result.kind === 'course') redirect(result.href);
  const product = result.product;
  const entitlements = await getUserEntitlements(user.id);
  const access = product.is_free ? 'available' : determineAccessState(entitlements, product.id, product.status);
  trackEvent('product_viewed', { userId: user.id, productId: product.id });
  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="text-3xl font-editorial font-bold text-(--color-amf-plum) mb-4">{product.name}</h1>
      {product.description && <p className="text-(--color-amf-muted) whitespace-pre-wrap mb-8">{product.description}</p>}
      <section className="rounded-2xl border border-(--color-amf-border) bg-white p-6">
        <h2 className="text-xl font-bold text-(--color-amf-plum) mb-3">{access === 'available' ? 'Produto disponível na sua conta' : access === 'expired' ? 'Acesso encerrado' : 'Acesso restrito'}</h2>
        <p className="text-(--color-amf-muted)">{access === 'available'
          ? 'Consulte seus conteúdos na Academia. Se precisar localizar o material deste produto, fale com o suporte.'
          : 'Não há um acesso vigente a este produto na sua conta. Se você já adquiriu, fale com o suporte.'}</p>
        <div className="mt-6 flex flex-wrap gap-5">
          <Link href="/app/academia" className="font-semibold text-(--color-amf-plum) underline">Ir para a Academia</Link>
          <Link href="/app/perfil/suporte" className="font-semibold text-(--color-amf-plum) underline">Falar com o suporte</Link>
        </div>
      </section>
    </div>
  );
}
