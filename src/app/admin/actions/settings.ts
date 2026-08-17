'use server'

import { requireAal2, writeAdminAuditEvent } from '@/lib/auth/dal'
import { revalidatePath } from 'next/cache'

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
