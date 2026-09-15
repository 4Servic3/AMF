import 'server-only'
import { requirePermission } from '@/lib/auth/dal'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { CaseOption,CaseStoryRow } from '@/lib/case-stories'
export async function loadAdminStoryLibrary() {
 await requirePermission('cases.manage')
 const db=createServiceRoleClient(), cases:CaseOption[]=[], stories:(CaseStoryRow & {published_at:string|null})[]=[]
 // Page explicitly: Supabase's default row limit must not silently hide the archive or pending uploads.
 for(let offset=0;;offset+=500){
  const {data,error}=await db.from('cases').select('id,title').neq('status','archived').in('visibility',['free','authenticated']).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+499)
  if(error)throw new Error('Não foi possível carregar os casos.')
  cases.push(...(data||[]));if(!data || data.length<500)break
 }
 for(let offset=0;;offset+=500){
  const {data,error}=await db.from('case_story_videos').select('id,case_id,caption,status,created_at,published_at').neq('status','archived').order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+499)
  if(error)throw new Error('Não foi possível carregar os stories.')
  stories.push(...(data||[]));if(!data || data.length<500)break
 }
 return {cases,stories}
}
