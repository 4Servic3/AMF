import { requirePermission } from '@/lib/auth/dal'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import CaseStoryStudio from '@/components/admin/cases/CaseStoryStudio'
import { notFound } from 'next/navigation'

export default async function CaseEditorPage({ params }: { params: Promise<{id:string}> }) {
  await requirePermission('cases.manage')
  const {id} = await params
  const db = createServiceRoleClient()
  const [cases,stories] = await Promise.all([
    db.from('cases').select('id,title').neq('status','archived').in('visibility',['free','authenticated']).order('created_at',{ascending:false}),
    db.from('case_story_videos').select('id,case_id,caption,status,created_at').eq('case_id',id === 'new' ? '00000000-0000-0000-0000-000000000000' : id).neq('status','archived').order('created_at',{ascending:false}).limit(100),
  ])
  if (cases.error || stories.error) throw new Error('Não foi possível carregar os casos.')
  if (id !== 'new' && !cases.data?.some((item:{id:string}) => item.id === id)) notFound()
  return <div className="mx-auto max-w-3xl"><CaseStoryStudio cases={cases.data || []} stories={stories.data || []} selectedCase={id === 'new' ? '' : id} /></div>
}
