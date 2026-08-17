'use server'

import { requireAal2, writeAdminAuditEvent } from '@/lib/auth/dal'
import { revalidatePath } from 'next/cache'

export async function replyToTicket(ticketId: string, content: string, isInternal: boolean) {
  await requireAal2()

  console.log(`Replying to ticket ${ticketId}. Internal: ${isInternal}`)

  await writeAdminAuditEvent({
    action: 'reply_ticket',
    resourceType: 'support_ticket',
    resourceId: ticketId,
    details: { isInternal, length: content.length }
  })

  revalidatePath(`/admin/support/${ticketId}`)
  return { success: true }
}
