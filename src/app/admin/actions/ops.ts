'use server'

import { requirePermission, requireAal2, writeAdminAuditEvent } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reprocessWebhook(webhookId: string) {
  await requireAal2()
  await requirePermission('ops.manage')
  const supabase = await createClient()
  
  const { error } = await supabase.from('webhook_events')
    .update({ status: 'pending' })
    .eq('id', webhookId)
    
  if (error) throw new Error(error.message)
    
  await writeAdminAuditEvent({
    action: 'reprocess_webhook',
    resourceType: 'webhook',
    resourceId: webhookId,
  })
  
  revalidatePath('/admin/operations')
}

export async function requeueJob(jobId: string) {
  await requireAal2()
  await requirePermission('ops.manage')
  const supabase = await createClient()
  
  const { error } = await supabase.from('background_jobs')
    .update({ status: 'queued' })
    .eq('id', jobId)
    
  if (error) throw new Error(error.message)
    
  await writeAdminAuditEvent({
    action: 'requeue_job',
    resourceType: 'job',
    resourceId: jobId,
  })
  
  revalidatePath('/admin/operations')
}
