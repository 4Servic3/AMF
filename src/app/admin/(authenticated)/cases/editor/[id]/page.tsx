import { requirePermission } from '@/lib/auth/dal'
import { redirect } from 'next/navigation'
import { z } from 'zod'
export default async function CaseEditorPage({params}:{params:Promise<{id:string}>}) {
 await requirePermission('cases.manage')
 const {id}=await params
 redirect(id!=='new' && z.string().uuid().safeParse(id).success ? '/admin/stories?case='+id : '/admin/stories')
}
