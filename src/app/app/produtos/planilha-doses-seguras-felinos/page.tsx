import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Download, LockKeyhole, Calculator, FileSpreadsheet } from 'lucide-react';
import { getPlanilhaAccess } from '@/lib/products/planilha-access';
import { gatewayHref, PRODUCT_SLUGS } from '@/lib/commerce/gateway';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Doses Seguras para Felinos | AMF' };
const base = '/app/produtos/planilha-doses-seguras-felinos';

export default async function PlanilhaProductPage() {
  const access = await getPlanilhaAccess();
  if (access.state === 'unauthenticated') redirect('/entrar');
  const available = access.state === 'available';
  return (
    <div className="mx-auto w-full max-w-5xl pb-8 text-[#24102D]">
      <Link href="/app" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#1F5F54]"><ArrowLeft size={18} />Voltar ao início</Link>
      <div className="overflow-hidden rounded-3xl border border-[#DDD5C4] bg-[#FBF6EC]">
        <Image src="/assets/amf-home/banner-planilha-felinos.jpeg" alt="Planilha de Doses Seguras para Felinos — Dra. Polyana" width={1600} height={900} priority className="h-auto w-full" sizes="(max-width: 1024px) 100vw, 1024px" />
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1F5F54]">Ferramentas para a rotina clínica</p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Doses Seguras para Felinos</h1>
            <p className="mt-3 text-sm leading-6 text-[#625C62]">Consulte a ferramenta da Dra. Polyana no AMF e tenha a planilha Excel à mão.</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-3"><Calculator size={20} className="shrink-0 text-[#1F5F54]" />Calculadora web com busca e categorias</li>
              <li className="flex items-center gap-3"><FileSpreadsheet size={20} className="shrink-0 text-[#1F5F54]" />Arquivo original em Excel para download</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#DDD5C4] bg-white p-5 sm:p-6">
            {available ? <>
              <p className="mb-1 text-sm font-semibold text-[#1F5F54]">Produto liberado</p>
              <h2 className="text-xl font-semibold">Escolha como usar</h2>
              <Link href={base + '/calculadora'} prefetch={false} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5F54] px-4 py-3 text-center text-sm font-semibold text-white">Abrir calculadora<ArrowUpRight size={18} /></Link>
              <a href="/api/products/planilha-doses-seguras-felinos/download" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#1F5F54] px-4 py-3 text-center text-sm font-semibold text-[#1F5F54]"><Download size={18} />Baixar planilha Excel</a>
            </> : <>
              <LockKeyhole size={24} className="mb-3 text-[#1F5F54]" />
              <h2 className="text-xl font-semibold">{access.state === 'unavailable' ? 'Acesso temporariamente indisponível' : 'Conteúdo exclusivo do produto'}</h2>
              <p className="mt-3 text-sm leading-6 text-[#625C62]">{access.state === 'unavailable' ? 'Não foi possível verificar seu acesso agora. Tente novamente em instantes.' : 'A calculadora e o arquivo Excel ficam disponíveis para quem adquiriu este produto. Se você já comprou, confira se entrou com o mesmo e-mail da compra.'}</p>
              {access.state === 'locked' && <Link href={gatewayHref({ kind: 'product', slug: PRODUCT_SLUGS.planilha }, 'planilha')} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5F54] px-4 py-3 text-sm font-semibold text-white">Liberar acesso<ArrowUpRight size={18} /></Link>}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
