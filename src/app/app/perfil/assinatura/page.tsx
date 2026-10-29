import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getMemberAccess } from '@/lib/access/member-access';
import { PRODUCT_SLUGS } from '@/lib/commerce/gateway';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Minhas compras | AMF',
};

type Purchase = { key: string; name: string; href: string };

async function loadPurchases(): Promise<Purchase[] | null> {
  const access = await getMemberAccess();
  if (access.state !== 'ready') return null;
  const db = await createClient();
  const purchases: Purchase[] = [];

  if (access.courseIds.size > 0) {
    const { data, error } = await db.from('courses').select('id,slug,title').in('id', [...access.courseIds]).eq('status', 'published').order('title');
    if (error) return null;
    for (const course of data || []) purchases.push({ key: course.id, name: course.title, href: `/app/cursos/${encodeURIComponent(course.slug)}` });
  }

  if (access.productIds.size > 0) {
    const { data, error } = await db.from('products').select('id,name,slug,type').in('id', [...access.productIds]).neq('type', 'course').order('name');
    if (error) return null;
    for (const product of data || []) {
      if (product.slug === PRODUCT_SLUGS.casos) continue;
      const href = product.slug === PRODUCT_SLUGS.planilha ? '/app/produtos/planilha-doses-seguras-felinos/calculadora' : '/app';
      purchases.push({ key: product.id, name: product.name, href });
    }
  }

  if (access.hasCasesAccess) purchases.push({ key: 'casos', name: 'Casos Clínicos AMF', href: '/app/casos' });
  return purchases;
}

export default async function MinhasComprasPage() {
  const purchases = await loadPurchases();

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0">
      <header className="amf-member-header w-full bg-[#160820] text-white pt-10 sm:pt-14 pb-8 shrink-0">
        <div className="w-full max-w-4xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/app/perfil" className="w-[40px] h-[40px] rounded-full border border-white/20 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B64F]" aria-label="Voltar para Perfil">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </Link>
            <h1 className="amf-page-heading text-[20px] font-bold text-white">Minhas compras</h1>
          </div>
        </div>
      </header>

      <div className="w-full flex-1 bg-[#FAF7F1] rounded-t-[28px] -mt-6 relative z-20 flex flex-col min-w-0">
        <main className="w-full max-w-4xl mx-auto px-6 pt-10 pb-20 min-w-0">
          {purchases === null ? (
            <p className="text-[14px] text-[#657080]">Não foi possível carregar seus acessos agora. Tente novamente em instantes.</p>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center pt-6 text-center">
              <div className="w-20 h-20 rounded-full bg-[#E7B64F]/10 flex items-center justify-center text-[#E7B64F] mb-6">
                <ShoppingBag size={40} strokeWidth={1.5} />
              </div>
              <h2 className="amf-section-heading text-[20px] font-editorial text-[#14172A] font-bold mb-2">Nenhuma compra ainda</h2>
              <p className="text-[14px] text-[#657080] max-w-[320px] mb-8">Quando você comprar um curso ou produto, ele aparece aqui.</p>
              <Link href="/app/cursos" className="h-[48px] px-8 rounded-full flex items-center justify-center font-bold text-[14px] text-white bg-[#003D3F] hover:bg-[#0E5B5C] transition-colors">Ver cursos</Link>
            </div>
          ) : (
            <ul className="amf-widget bg-white rounded-2xl border border-[#E8E1D3] shadow-sm overflow-hidden">
              {purchases.map((purchase) => (
                <li key={purchase.key} className="border-b border-[#E8E1D3] last:border-0">
                  <Link href={purchase.href} className="flex min-h-14 items-center justify-between gap-4 p-4 hover:bg-[#FAF7F1]">
                    <span className="font-bold text-[#160820] text-[15px]">{purchase.name}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#0E5B5C]">Acessar <ArrowUpRight size={16} aria-hidden="true" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-[13px] text-[#657080]">Dúvidas sobre pagamento ou acesso? <Link href="/app/perfil/suporte" className="font-bold text-[#0E5B5C] underline">Fale com o suporte</Link>.</p>
        </main>
      </div>
    </div>
  );
}
