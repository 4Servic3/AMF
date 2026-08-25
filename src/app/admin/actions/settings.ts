'use server'

import { requireAal2, writeAdminAuditEvent } from '@/lib/auth/dal'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function saveSetting(key: string, value: any) {
  await requireAal2()
  
  console.log(`Saved setting ${key}=${value}`)

  await writeAdminAuditEvent({
    action: 'update_setting',
    resourceType: 'setting',
    resourceId: key,
    details: { value }
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function forceLogoutAllUsers() {
  await requireAal2()
  
  console.log('Forcing logout for all users...')

  await writeAdminAuditEvent({
    action: 'force_logout_all',
    resourceType: 'system',
  })
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const session = await requireAal2()
  
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Get previous value
  const { data: oldData } = await supabase.from('feature_flags').select('enabled').eq('key', key).single()
  const previousValue = oldData?.enabled

  // Update
  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_by: session.user.id })
    .eq('key', key)
    
  if (error) {
    throw new Error('Falha ao atualizar flag')
  }

  await writeAdminAuditEvent({
    action: 'update_feature_flag',
    resourceType: 'feature_flag',
    resourceId: key,
    details: { previousValue, newValue: enabled }
  })

  revalidatePath('/', 'layout')
  revalidatePath('/admin/settings', 'page')
  
  return { success: true }
}
