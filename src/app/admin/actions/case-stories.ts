'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/dal'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createDirectUpload, getMuxClient } from '@/lib/mux/client'
import { caseStoryInput } from '@/lib/case-stories'
import { syncCaseStory } from '@/lib/mux/case-stories'
import { reorderedTimestamps } from '@/lib/story-lifecycle'
import { z } from 'zod'

export async function startCaseStory(input: unknown) {
  const session = await requirePermission('cases.manage')
  const parsed = caseStoryInput.safeParse(input)
  if (!parsed.success) {
    const rule = parsed.error.issues.find(issue => issue.code === 'custom')
    return { error: rule?.message || 'Selecione um caso e um vídeo de até 1 GB ou imagem JPG, PNG ou WebP de até 10 MB.' }
  }
  const data = parsed.data
  // Só envia a coluna quando há agendamento: sem data, o insert é igual ao de antes.
  const schedule = data.scheduledFor ? { scheduled_for: data.scheduledFor } : {}
  const db = createServiceRoleClient()
  let caseId = data.caseId
  if (caseId) {
    const found = await db.from('cases').select('id').eq('id', caseId).neq('status','archived').in('visibility',['free','authenticated']).maybeSingle()
    if (found.error || !found.data) return { error: 'Caso indisponível. Selecione um caso de acesso aos membros.' }
  } else {
    caseId = crypto.randomUUID()
    const created = await db.from('cases').insert({ id: caseId, title: data.caseTitle, slug: `caso-${caseId}`, author_id: session.user.id, status: 'draft', visibility: 'authenticated' })
    if (created.error) return { error: 'Não foi possível criar o caso.' }
  }
  let uploadId: string | undefined
  try {
    const origin = (await headers()).get('origin') || ''
    const id = crypto.randomUUID()
    if (data.fileType.startsWith('image/')) {
      const path = `${caseId}/${id}`
      const signed = await db.storage.from('case-story-images').createSignedUploadUrl(path,{upsert:false})
      if (signed.error) throw new Error('upload_failed')
      const saved = await db.from('case_story_videos').insert({id,case_id:caseId,caption:data.caption,media_type:'image',storage_path:path,size_bytes:data.fileSize,created_by:session.user.id,...schedule})
      if (saved.error) throw new Error('save_failed')
      return {id,caseId,path,token:signed.data.token}
    }
    const upload = await createDirectUpload({ corsOrigin: origin, passthrough: `case-story:${id}` })
    uploadId = upload.uploadId
    const saved = await db.from('case_story_videos').insert({ id, case_id: caseId, caption: data.caption, mux_upload_id: uploadId, created_by: session.user.id, ...schedule })
    if (saved.error) throw new Error('save_failed')
    revalidatePath('/admin/stories'); revalidatePath('/admin/cases')
    return { id, caseId, uploadUrl: upload.uploadUrl }
  } catch {
    if (uploadId) await getMuxClient().video.uploads.cancel(uploadId).catch(() => undefined)
    return { error: 'Não foi possível iniciar o envio. Tente novamente.' }
  }
}

export async function finishCaseStory(id: string) {
  await requirePermission('cases.manage')
  if (!z.string().uuid().safeParse(id).success) return { error: 'Vídeo inválido.' }
  try {
    const status = await syncCaseStory(id)
    revalidatePath('/app'); revalidatePath('/app/casos')
    revalidatePath('/admin/stories'); revalidatePath('/admin/cases')
    return { status }
  } catch { return { error: 'Não foi possível verificar o vídeo. Tente novamente.' } }
}

export async function archiveCaseStory(id: string) {
  await requirePermission('cases.manage')
  if (!z.string().uuid().safeParse(id).success) return {error:'Story inválido.'}
  const result = await createServiceRoleClient().from('case_story_videos').update({status:'archived'}).eq('id',id)
  if (result.error) return {error:'Não foi possível remover o story.'}
  revalidatePath('/admin/stories'); revalidatePath('/admin/cases'); revalidatePath('/app'); revalidatePath('/app/casos')
  return {success:true}
}

/** Muda a ordem dos stories publicados de um caso, na sequência em que aparecem para o aluno. */
export async function reorderCaseStories(caseId: string, orderedIds: string[]) {
  await requirePermission('cases.manage')
  const ids = z.array(z.string().uuid()).max(200).safeParse(orderedIds)
  if (!z.string().uuid().safeParse(caseId).success || !ids.success) return {error:'Ordem inválida.'}
  const db = createServiceRoleClient()
  const current = await db.from('case_story_videos').select('id,created_at').eq('case_id',caseId).eq('status','published')
  if (current.error) return {error:'Não foi possível carregar os stories do caso.'}
  const changes = reorderedTimestamps(current.data || [], ids.data)
  if (!changes) return {error:'A lista de stories mudou. Recarregue a página e tente de novo.'}
  for (const change of changes) {
    const result = await db.from('case_story_videos').update({created_at:change.created_at}).eq('id',change.id).eq('case_id',caseId)
    if (result.error) return {error:'Não foi possível salvar a nova ordem.'}
  }
  revalidatePath('/admin/cases'); revalidatePath('/app'); revalidatePath('/app/casos')
  return {success:true}
}
