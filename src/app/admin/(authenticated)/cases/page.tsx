import Link from 'next/link'
import { loadAdminStoryLibrary } from '@/lib/admin-story-library'
import CaseStoryArchive from '@/components/admin/cases/CaseStoryArchive'
export const metadata = { title: 'Casos clínicos | AMF Admin' }
export default async function CasesPage() {
  const {cases,stories}=await loadAdminStoryLibrary()
  const groups=new Map<string,typeof stories>()
  for(const story of stories){const group=groups.get(story.case_id)||[];group.push(story);groups.set(story.case_id,group)}
  const data=cases.map(c=>({...c,case_story_videos:groups.get(c.id)||[]}))
  return <div className="mx-auto max-w-5xl space-y-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Casos clínicos</h1><p className="mt-2 text-amf-muted">Arquivo permanente de stories, organizado por caso.</p></div><Link href="/admin/stories" className="rounded-2xl bg-amf-petrol-700 px-5 py-3 font-semibold text-white">Publicar story</Link></header><CaseStoryArchive cases={data || []} /></div>
}
