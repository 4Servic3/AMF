import { loadAdminStoryLibrary } from '@/lib/admin-story-library'
import CaseStoryStudio from '@/components/admin/cases/CaseStoryStudio'

export const metadata = { title: 'Publicar stories | AMF Admin' }
export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const {cases,stories}=await loadAdminStoryLibrary()
  const requested=(await searchParams).case
  const selected=cases.some(c=>c.id===requested)?requested:''
  return <div className="mx-auto max-w-3xl space-y-6"><h1 className="text-2xl font-semibold">Stories</h1><p className="text-amf-muted">Publique em 9:16. Cada story aparece por 48 horas na home e permanece salvo no seu caso.</p><CaseStoryStudio selectedCase={selected} cases={cases} stories={stories.filter(s=>s.status!=='published')} /></div>
}
