import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, Download, FileText, Folder } from 'lucide-react';
import { loadMemberMaterials } from '@/lib/member-materials';
export const metadata = { title: 'Materiais | AMF' };
export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ after?: string | string[] }> }) {
  const params = await searchParams;
  const after = typeof params.after === 'string' ? params.after : undefined;
  let result: Awaited<ReturnType<typeof loadMemberMaterials>>;
  try {
    result = await loadMemberMaterials(after);
  } catch {
    return <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="amf-page-heading text-xl font-bold text-[#14172A]">Meus materiais</h1>
      <p role="alert" className="mt-4 text-sm text-[#657080]">Não foi possível carregar seus materiais. Tente novamente em instantes.</p>
      <a href="/app/perfil/materiais" className="mt-6 inline-block rounded-lg bg-[#160820] px-4 py-3 text-sm text-white">Tentar novamente</a>
      <Link href="/app/perfil" className="ml-4 inline-block py-3 text-sm text-[#714895] underline">Voltar ao perfil</Link>
    </main>;
  }
  const { userId, items, nextCursor } = result;
  if (!userId) redirect('/entrar');
  return <div className="flex w-full min-h-screen min-w-0 flex-col bg-[#FAF7F1]">
    <header className="amf-member-header bg-[#160820] pt-10 pb-12 text-white sm:pt-14">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-6">
        <Link href="/app/perfil" aria-label="Voltar para Perfil" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#E7B64F]"><ChevronLeft size={20} /></Link>
        <h1 className="amf-page-heading text-xl font-bold">Meus materiais</h1>
      </div>
    </header>
    <main className="relative -mt-6 mx-auto w-full max-w-4xl flex-1 rounded-t-[28px] bg-[#FAF7F1] px-6 pt-8 pb-24">
      <p className="mb-6 text-sm text-[#657080]">Arquivos disponíveis nas aulas dos cursos aos quais você tem acesso.</p>
      {items.length === 0 ? <div className="py-12 text-center">
        <Folder size={40} className="mx-auto mb-4 text-[#A77521]" aria-hidden="true" />
        <h2 className="amf-section-heading text-xl font-bold text-[#14172A]">Nenhum material disponível nesta página</h2>
        <p className="mt-2 text-sm text-[#657080]">Os materiais publicados pela equipe aparecerão aqui conforme seu acesso aos cursos.</p>
        <Link href="/app/cursos" className="mt-5 inline-block rounded-lg bg-[#160820] px-4 py-3 text-sm text-white">Explorar cursos</Link>
      </div> : <ul className="space-y-4">{items.map(item => <li key={item.id} className="rounded-2xl border border-[#14172A]/10 bg-white p-5">
        <div className="flex items-start gap-3"><FileText className="mt-1 shrink-0 text-[#714895]" size={22} aria-hidden="true" /><div className="min-w-0">
          <h2 className="break-words font-semibold text-[#14172A]">{item.title}</h2>
          <Link href={item.courseHref} className="mt-1 block break-words text-sm text-[#714895] underline underline-offset-2">{item.courseTitle}</Link>
          <p className="mt-1 break-words text-sm text-[#657080]">{item.lessonTitle}</p>
        </div></div>
        <div className="mt-4 flex flex-wrap gap-3">
          {item.viewHref && <a href={item.viewHref} target="_blank" rel="noopener noreferrer" aria-label={'Visualizar ' + item.title + ' em nova aba'} className="rounded-lg border border-[#714895]/30 px-4 py-3 text-sm font-medium text-[#714895]">Visualizar PDF</a>}
          {item.downloadHref && <a href={item.downloadHref} className="inline-flex items-center gap-2 rounded-lg bg-[#160820] px-4 py-3 text-sm font-medium text-white"><Download size={16} aria-hidden="true" />Baixar<span className="sr-only"> {item.title}</span></a>}
          {!item.viewHref && !item.downloadHref && <p className="text-sm text-[#657080]">Visualização e download indisponíveis para este material.</p>}
        </div>
      </li>)}</ul>}
      {(after || nextCursor) && <nav aria-label="Paginação dos materiais" className="mt-8 flex flex-wrap justify-between gap-4">
        {after && <Link href="/app/perfil/materiais" className="rounded-lg border border-[#714895]/30 px-4 py-3 text-sm text-[#714895]">Voltar ao início</Link>}
        {nextCursor && <Link href={'/app/perfil/materiais?after=' + encodeURIComponent(nextCursor)} className="ml-auto rounded-lg bg-[#160820] px-4 py-3 text-sm text-white">Próximos materiais</Link>}
      </nav>}
    </main>
  </div>;
}
