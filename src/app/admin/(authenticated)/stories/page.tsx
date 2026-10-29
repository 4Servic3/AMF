import { loadAdminStoryLibrary } from '@/lib/admin-story-library'
import CaseStoryStudio from '@/components/admin/cases/CaseStoryStudio'
import PageHeader from '@/components/admin/ui/PageHeader'
import { STORY_HOME_LIFETIME_MS, storyIsRecent } from '@/lib/story-lifecycle'

export const metadata = { title: 'Publicar stories | AMF Admin' }
// Hora do pedido: decide quais stories ainda estão na home.
const requestTime = () => Date.now()

function timeLeft(publishedAt: string, now: number) {
  const hours = Math.max(1, Math.ceil((Date.parse(publishedAt) + STORY_HOME_LIFETIME_MS - now) / 3_600_000))
  return hours === 1 ? 'sai da home em 1 hora' : `sai da home em ${hours} horas`
}

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const {cases,stories}=await loadAdminStoryLibrary()
  const requested=(await searchParams).case
  const selected=cases.some(c=>c.id===requested)?requested:''
  const now=requestTime()
  const titles=new Map(cases.map(c=>[c.id,c.title]))
  const live=stories.filter(s=>s.status==='published'&&storyIsRecent(s.published_at,now)).sort((a,b)=>(b.published_at||'').localeCompare(a.published_at||''))
  return <div className="mx-auto max-w-5xl space-y-6">
    <PageHeader title="Stories" description="Publique em 9:16. Cada story fica 48 horas na home do aluno e continua salvo no caso." />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="amf-panel min-w-0"><h2 className="mb-4 text-[17px]">Novo story</h2><CaseStoryStudio selectedCase={selected} cases={cases} stories={stories.filter(s=>s.status!=='published')} /></section>
      <aside className="amf-panel h-fit" aria-labelledby="na-home">
        <h2 id="na-home" className="text-[17px]">Na home agora</h2>
        <p className="mt-1 text-sm text-[var(--admin-secondary)]">{live.length ? `${live.length} ${live.length===1?'story aparece':'stories aparecem'} para os alunos.` : 'Nenhum story nas últimas 48 horas.'}</p>
        <ul className="mt-4 space-y-3">{live.map(s=><li key={s.id} className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={'/api/case-stories/'+s.id+'/thumbnail'} alt="" loading="lazy" className="h-16 w-9 shrink-0 rounded-md bg-[var(--admin-fill)] object-cover" />
          <span className="min-w-0 text-sm"><span className="block truncate font-medium">{titles.get(s.case_id)||'Caso'}</span><span className="block truncate text-[var(--admin-secondary)]">{s.caption||'Sem legenda'}</span><span className="block text-xs text-[var(--admin-tertiary)]">{timeLeft(s.published_at!,now)}</span></span>
        </li>)}</ul>
      </aside>
    </div>
  </div>
}
