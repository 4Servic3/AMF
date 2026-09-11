import { requirePermission } from '@/lib/auth/dal'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import CaseStoryStudio from '@/components/admin/cases/CaseStoryStudio'

export const metadata = { title: 'Casos e stories | AMF Admin' }
export default async function CasesPage() {
  await requirePermission('cases.manage')
  const db = createServiceRoleClient()
  const [cases,stories] = await Promise.all([
    db.from('cases').select('id,title').neq('status','archived').in('visibility',['free','authenticated']).order('created_at',{ascending:false}),
    db.from('case_story_videos').select('id,case_id,caption,status,created_at').neq('status','archived').order('created_at',{ascending:false}).limit(100),
  ])
  if (cases.error || stories.error) throw new Error('Não foi possível carregar os casos. Tente novamente.')
  return <div className="mx-auto max-w-3xl space-y-6"><h1 className="text-2xl font-semibold">Casos e stories</h1><CaseStoryStudio cases={cases.data || []} stories={stories.data || []} /></div>
}
