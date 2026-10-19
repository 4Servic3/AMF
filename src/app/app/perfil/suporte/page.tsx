import Link from 'next/link';
import { listOwnTickets } from '@/lib/member-support';
import { ticketStatuses } from '@/lib/member-account-schema';
import { SupportForm } from './support-form';
import { SupportShell } from './support-shell';
export const metadata = { title: 'Ajuda e suporte | AMF' };

export default async function SuportePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const result = await listOwnTickets(page);
  return <SupportShell>
    <section className="mb-10 rounded-2xl border border-[#DED5C8] bg-white p-5 sm:p-7">
      <h2 className="mb-5 text-xl font-bold text-[#14172A]">Novo chamado</h2>
      <SupportForm />
    </section>
    <section>
      <h2 className="mb-5 text-xl font-bold text-[#14172A]">Meus chamados</h2>
      {result.tickets.length ? <ul className="space-y-3">{result.tickets.map((ticket) => <li key={ticket.id}>
        <Link href={`/app/perfil/suporte/${ticket.id}`} className="block rounded-xl border border-[#DED5C8] bg-white p-4 hover:border-[#003D3F]">
          <span className="block break-words font-semibold text-[#14172A]">{ticket.subject}</span>
          <span className="mt-2 block text-sm text-[#657080]">{ticketStatuses[ticket.status]} · {new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
        </Link>
      </li>)}</ul> : <p className="text-[#657080]">Nenhum chamado nesta página.</p>}
      <nav aria-label="Páginas de chamados" className="mt-5 flex gap-6 text-sm font-semibold">
        {result.page > 1 && <Link href={`?page=${result.page - 1}`}>Página anterior</Link>}
        {result.hasMore && <Link href={`?page=${result.page + 1}`}>Próxima página</Link>}
      </nav>
    </section>
  </SupportShell>;
}
