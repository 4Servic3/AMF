'use server'

import { requireAal2, requirePermission, writeAdminAuditEvent } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCaseDraft(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('cases.manage')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (id) {
    const { error } = await supabase
      .from('cases')
      .update(data)
      .eq('id', id)

    if (error) throw new Error('Error updating case')
    await writeAdminAuditEvent({
      action: 'case.update',
      resourceType: 'cases',
      resourceId: id,
    })
    revalidatePath('/admin/cases')
    return { success: true, id }
  } else {
    const { data: inserted, error } = await supabase
      .from('cases')
      .insert({ ...data, author_id: user?.id, status: 'draft' })
      .select('id')
      .single()

    if (error) throw new Error('Error creating case: ' + error.message)
    await writeAdminAuditEvent({
      action: 'case.create',
      resourceType: 'cases',
      resourceId: inserted.id,
    })
    revalidatePath('/admin/cases')
    return { success: true, id: inserted.id }
  }
}

export async function submitForReview(id: string) {
  await requireAal2()
  await requirePermission('cases.manage')
  const supabase = await createClient()

  const { data: caseData, error: fetchError } = await supabase
    .from('cases')
    .select('status, version')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Case not found')

  const { error } = await supabase
    .from('cases')
    .update({ status: 'in_review' })
    .eq('id', id)

  if (error) throw new Error('Error submitting case')

  await writeAdminAuditEvent({
    action: 'case.submit_review',
    resourceType: 'cases',
    resourceId: id,
  })
  
  revalidatePath('/admin/cases')
  return { success: true }
}

export async function approveCase(id: string) {
  await requireAal2()
  const session = await requirePermission('cases.manage')
  const supabase = await createClient()
  const userId = session.user.id

  const { data: caseData, error: fetchError } = await supabase
    .from('cases')
    .select('author_id')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Case not found')
  if (caseData.author_id === userId) {
    throw new Error('FOUR_EYES_VIOLATION: You cannot approve your own case.')
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: 'approved', clinical_reviewer_id: userId })
    .eq('id', id)

  if (error) throw new Error('Error approving case: ' + error.message)

  await writeAdminAuditEvent({
    action: 'case.approve',
    resourceType: 'cases',
    resourceId: id,
  })
  
  revalidatePath('/admin/cases')
  return { success: true }
}

export async function rejectCase(id: string, reason: string) {
  await requireAal2()
  await requirePermission('cases.manage')
  const supabase = await createClient()

  const { error } = await supabase
    .from('cases')
    .update({ status: 'changes_requested' })
    .eq('id', id)

  if (error) throw new Error('Error rejecting case')

  await writeAdminAuditEvent({
    action: 'case.reject',
    resourceType: 'cases',
    resourceId: id,
    reason,
  })
  
  revalidatePath('/admin/cases')
  return { success: true }
}

export async function publishCase(id: string) {
  await requireAal2()
  await requirePermission('cases.manage')
  const supabase = await createClient()

  const { data: caseData, error: fetchError } = await supabase
    .from('cases')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Case not found')
  if (caseData.status !== 'approved') {
    throw new Error('Case must be approved before publishing')
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('Error publishing case')

  await writeAdminAuditEvent({
    action: 'case.publish',
    resourceType: 'cases',
    resourceId: id,
  })
  
  revalidatePath('/admin/cases')
  return { success: true }
}
