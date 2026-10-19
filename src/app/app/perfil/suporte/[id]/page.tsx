import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOwnTicket } from '@/lib/member-support';
import { ticketStatuses } from '@/lib/member-account-schema';
import { SupportForm } from '../support-form';
import { SupportShell } from '../support-shell';
export const metadata = { title: 'Chamado | AMF' };

export default async function TicketPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ id }, { page }] = await Promise.all([params, searchParams]);
  const result = await getOwnTicket(id, page);
  if (!result) notFound();
  const { ticket, messages } = result;
  return <SupportShell backHref="/app/perfil/suporte" title="Meu chamado">
    <h2 className="break-words text-2xl font-bold text-[#14172A]">{ticket.subject}</h2>
    <p className="mb-6 mt-2 text-sm text-[#657080]">{ticketStatuses[ticket.status]} · {new Date(ticket.created_at).toLocaleDateString('pt-BR')}</p>
    <ol className="space-y-4">{messages.map((message) => <li key={message.id} className={`rounded-2xl border border-[#DED5C8] p-5 ${message.own ? 'bg-white' : 'bg-[#EDF5F3]'}`}>
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-[#657080]"><span className="font-semibold">{message.own ? 'Você' : 'Equipe AMF'}</span><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString('pt-BR')}</time></div>
      <p className="whitespace-pre-wrap break-words text-sm text-[#14172A]">{message.content}</p>
    </li>)}</ol>
    {!messages.length && <p className="text-[#657080]">Nenhuma mensagem nesta página.</p>}
    <nav aria-label="Histórico da conversa" className="my-6 flex gap-6 text-sm font-semibold">
      {result.hasMore && <Link href={`?page=${result.page + 1}`}>Mensagens anteriores</Link>}
      {result.page > 1 && <Link href={`?page=${result.page - 1}`}>Mensagens mais recentes</Link>}
    </nav>
    {['open', 'pending'].includes(ticket.status) ? <section className="mt-8 rounded-2xl border border-[#DED5C8] bg-white p-5"><h2 className="mb-5 text-xl font-bold">Responder</h2><SupportForm ticketId={ticket.id} /></section>
      : <p className="mt-8 text-sm text-[#657080]">Este chamado foi encerrado. <Link className="font-semibold underline" href="/app/perfil/suporte">Abra um novo chamado</Link> se precisar de ajuda.</p>}
  </SupportShell>;
}
