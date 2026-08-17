'use server'

import { requireAal2, writeAdminAuditEvent } from '@/lib/auth/dal'
import { revalidatePath } from 'next/cache'

export async function createCampaign(name: string, audience: string, channels: ('in_app' | 'email')[]) {
  await requireAal2()

  console.log(`Creating campaign ${name} for ${audience} via ${channels.join(', ')}`)

  await writeAdminAuditEvent({
    action: 'create_campaign',
    resourceType: 'communication',
    details: { name, audience, channels }
  })

  revalidatePath('/admin/communications')
  return { success: true }
}
