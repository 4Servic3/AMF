import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, CheckCircle2, CreditCard, LifeBuoy, ShieldCheck } from 'lucide-react'
import { gatewayBackHref, parseGatewayParams } from '@/lib/commerce/gateway'
import { loadGatewayOffer } from '@/lib/commerce/offer'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Liberar acesso | AMF' }

function GatewayCard({ back, header, children }: { back: string; header: React.ReactNode; children?: React.ReactNode }) {
  return (
    <main className="grid min-h-[80dvh] place-items-center px-1 py-6 sm:py-10">
      <section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#DED5C8] bg-white shadow-[0_20px_55px_rgba(22,8,32,.1)]">
        <div className="bg-[#160820] px-7 pb-8 pt-6 text-white sm:px-9">
          <Link href={back} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={16} aria-hidden="true" /> Voltar</Link>
          {header}
        </div>
        {children && <div className="px-7 py-7 sm:px-9">{children}</div>}
      </section>
    </main>
  )
}

export default async function GatewayPage({ searchParams }: { searchParams: Promise<{ produto?: string; curso?: string; origem?: string }> }) {
  const { target, origin } = parseGatewayParams(await searchParams)
  const back = gatewayBackHref(origin)
  const offer = target ? await loadGatewayOffer(target) : null

  if (!offer) {
    return (
      <GatewayCard back={back} header={<>
        <h1 className="mt-6 font-editorial text-2xl font-semibold">Oferta indisponível</h1>
        <p className="mt-2 text-sm leading-6 text-white/70">Este conteúdo não está à venda no momento.</p>
        <Link href="/app/cursos" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#E7B64F] px-5 font-semibold text-[#160820]">Ver cursos</Link>
      </>} />
    )
  }

  return (
    <GatewayCard back={back} header={<>
          <span className="mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#E7B64F]/15 text-[#E7B64F]">{offer.owned ? <CheckCircle2 size={25} aria-hidden="true" /> : <CreditCard size={25} aria-hidden="true" />}</span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#E7B64F]">{offer.owned ? 'Acesso liberado' : 'Liberar acesso'}</p>
          <h1 className="mt-1 font-editorial text-3xl font-semibold leading-tight">{offer.name}</h1>
          {offer.description && <p className="mt-2 text-sm leading-6 text-white/70">{offer.description}</p>}
          {offer.price && !offer.owned && <p className="mt-4 text-2xl font-semibold text-white">{offer.price}</p>}
      </>}>
          {offer.owned ? (
            <Link href={offer.accessHref} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0E5B5C] px-5 font-semibold text-white hover:bg-[#004F4D]">Acessar agora <ArrowUpRight size={18} aria-hidden="true" /></Link>
          ) : offer.checkoutUrl ? (
            <>
              <a href={offer.checkoutUrl} rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0E5B5C] px-5 font-semibold text-white hover:bg-[#004F4D]">Ir para o pagamento <ArrowUpRight size={18} aria-hidden="true" /></a>
              <div className="mt-5 flex gap-3 rounded-2xl bg-[#F8F4EC] p-4">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#0E5B5C]" size={20} aria-hidden="true" />
                <p className="text-sm leading-6 text-[#625C62]">O pagamento é feito no ambiente seguro do nosso parceiro. Use o mesmo e-mail desta conta na compra para que o acesso seja liberado nela.</p>
              </div>
            </>
          ) : (
            <div className="flex gap-3 rounded-2xl bg-[#F8F4EC] p-4">
              <LifeBuoy className="mt-0.5 shrink-0 text-[#0E5B5C]" size={20} aria-hidden="true" />
              <p className="text-sm leading-6 text-[#625C62]">As vendas deste conteúdo abrem em breve. Fale com o suporte para garantir sua vaga.</p>
            </div>
          )}
          {!offer.owned && <Link href="/app/perfil/suporte" className="mt-4 flex min-h-11 items-center justify-center text-sm font-semibold text-[#0E5B5C] hover:underline">Já comprei e não tenho acesso</Link>}
    </GatewayCard>
  )
}
