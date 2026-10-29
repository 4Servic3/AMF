import Link from 'next/link'
import PageHeader from '@/components/admin/ui/PageHeader'
import { loadAdminStoryLibrary } from '@/lib/admin-story-library'
import CaseStoryArchive from '@/components/admin/cases/CaseStoryArchive'
export const metadata = { title: 'Casos clínicos | AMF Admin' }
export default async function CasesPage() {
  const {cases,stories}=await loadAdminStoryLibrary()
  const groups=new Map<string,typeof stories>()
  for(const story of stories){const group=groups.get(story.case_id)||[];group.push(story);groups.set(story.case_id,group)}
  const data=cases.map(c=>({...c,case_story_videos:groups.get(c.id)||[]}))
  return <div className="mx-auto max-w-6xl space-y-6"><PageHeader title="Casos clínicos" description="Cada caso guarda seus stories. Abra um caso para ver, reordenar, adicionar ou remover." actions={<Link href="/admin/stories" className="amf-primary">Publicar story</Link>} /><CaseStoryArchive cases={data || []} /></div>
}
