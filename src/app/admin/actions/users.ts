'use server'

import { requirePermission, writeAdminAuditEvent } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function grantManualAccess(userId: string, productId: string, reason: string) {
  await requirePermission('users.manage')
  const supabase = await createClient()
  
  const { error } = await supabase.from('entitlements').insert({
    user_id: userId,
    product_id: productId,
    status: 'active',
    granted_by: 'admin_manual',
    reason
  })
  
  if (error) throw new Error(error.message)
    
  await writeAdminAuditEvent({
    action: 'grant_access',
    resourceType: 'user',
    resourceId: userId,
    details: { productId },
    reason
  })
  
  revalidatePath(`/admin/users/${userId}`)
}

export async function revokeAccess(userId: string, productId: string, reason: string) {
  await requirePermission('users.manage')
  const supabase = await createClient()
  
  const { error } = await supabase.from('entitlements')
    .update({ status: 'revoked' })
    .eq('user_id', userId)
    .eq('product_id', productId)
    
  if (error) throw new Error(error.message)
    
  await writeAdminAuditEvent({
    action: 'revoke_access',
    resourceType: 'user',
    resourceId: userId,
    details: { productId },
    reason
  })
  
  revalidatePath(`/admin/users/${userId}`)
}

export async function suspendUser(userId: string, reason: string) {
  await requirePermission('users.manage')
  const supabase = await createClient()
  
  const { error } = await supabase.from('users')
    .update({ status: 'suspended' })
    .eq('id', userId)
    
  if (error) throw new Error(error.message)
    
  await writeAdminAuditEvent({
    action: 'suspend_user',
    resourceType: 'user',
    resourceId: userId,
    reason
  })
  
  revalidatePath(`/admin/users/${userId}`)
}

export async function addInternalNote(userId: string, note: string) {
  await requirePermission('users.manage')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase.from('user_internal_notes').insert({
    user_id: userId,
    admin_id: user?.id,
    note
  })
  
  if (error) throw new Error(error.message)
    
  revalidatePath(`/admin/users/${userId}`)
}

export async function handleDataRequest(userId: string, actionType: 'export' | 'anonymize') {
  await requirePermission('users.manage')
  const supabase = await createClient()
  
  if (actionType === 'anonymize') {
    const { error } = await supabase.from('users')
      .update({ 
        first_name: 'Anonymized', 
        last_name: 'User', 
        email: `anonymized_${userId}@deleted.local`,
        status: 'anonymized'
      })
      .eq('id', userId)
      
    if (error) throw new Error(error.message)
      
    await writeAdminAuditEvent({
      action: 'anonymize_user',
      resourceType: 'user',
      resourceId: userId,
      reason: 'Data Request'
    })
  } else if (actionType === 'export') {
    await writeAdminAuditEvent({
      action: 'export_user_data',
      resourceType: 'user',
      resourceId: userId,
      reason: 'Data Request'
    })
  }
  
  revalidatePath(`/admin/users/${userId}`)
}
