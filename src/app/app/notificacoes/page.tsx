import Link from 'next/link';
import { listMemberNotifications } from '@/lib/member-notifications';
import { ReadNotificationsForm } from './read-form';
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  let result: Awaited<ReturnType<typeof listMemberNotifications>>;
  try { result = await listMemberNotifications(page); }
  catch { return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-bold">Notificações</h1><p role="alert" className="my-4">Não foi possível carregar seus avisos.</p><Link href="/app/notificacoes" className="underline">Tentar novamente</Link></main>; }
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold text-[#160820]">Notificações</h1>{result.items.some(item => !item.read) && <ReadNotificationsForm ids={result.items.filter(item => !item.read).map(item => item.id)} />}</div>
    {!result.items.length && <p className="rounded-2xl border border-[#DED5C8] bg-white p-8 text-[#657080]">Nenhuma notificação nesta página.</p>}
    <ul className="space-y-3">{result.items.map(item => <li key={item.id} className="min-w-0 rounded-2xl border border-[#DED5C8] bg-white p-5 break-words">
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-[#160820]">{item.title}</h2>{!item.read && <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-900">Não lida</span>}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-[#657080]">{item.message}</p>
      <time dateTime={item.created_at} className="mt-3 block text-xs text-[#657080]">{new Date(item.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</time>
      {item.target_url && <Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-[#003D3F] underline" href={item.target_url}>Ver conteúdo</Link>}
    </li>)}</ul>
    <nav aria-label="Páginas de notificações" className="flex justify-between gap-4">{result.page > 1 ? <Link className="inline-flex min-h-11 items-center underline" href={'?page=' + (result.page - 1)}>Anterior</Link> : <span />}{result.hasMore && <Link className="inline-flex min-h-11 items-center underline" href={'?page=' + (result.page + 1)}>Próxima</Link>}</nav>
  </main>;
}
