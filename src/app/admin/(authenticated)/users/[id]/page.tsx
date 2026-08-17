import { requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import UserCrmClient from './client'

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  await requirePermission('users.manage')
  const supabase = await createClient()
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()
    
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('*, product:products(name)')
    .eq('user_id', params.id)
    
  const { data: notes } = await supabase
    .from('user_internal_notes')
    .select('*, admin:users(first_name)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
    
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <UserCrmClient user={user} entitlements={entitlements || []} notes={notes || []} />
    </div>
  )
}
