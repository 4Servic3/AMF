'use server'

import { requireAal2, requirePermission, writeAdminAuditEvent, hasPermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const titleSchema = z.string().trim().min(1).max(200)
const statusSchema = z.enum(['draft', 'published', 'archived'])

function refreshCourses() {
  revalidatePath('/admin/courses', 'layout')
  revalidatePath('/app/cursos', 'layout')
  revalidatePath('/app')
}

// ─── Course CRUD ──────────────────────────────────────────────────────────────

export async function saveCourse(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()

  const courseSchema = z.object({
    title: titleSchema,
    description: z.string().max(20000).nullable().optional(),
    short_description: z.string().max(500).nullable().optional(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    workload: z.coerce.number().int().min(0).max(99999).nullable().optional(),
  })

  if (id && id !== 'new') {
    const input = courseSchema.parse(data)
    const { error } = await supabase
      .from('courses')
      .update(input)
      .eq('id', id)
      .select('id').single()
    if (error) throw new Error('Não foi possível salvar o curso: ' + error.message)
  } else {
    const input = courseSchema.parse(data)
    const { data: created, error } = await supabase
      .from('courses')
      .insert({ ...input, status: 'draft', is_published: false })
      .select('id').single()
    if (error) throw new Error('Não foi possível criar o curso: ' + error.message)
    id = created.id
  }
  refreshCourses()
  return { success: true, id: id! }
}

export async function saveModule(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()
  const input = z.object({ title: titleSchema, status: statusSchema }).parse(data)
  if (input.status === 'published') await requirePermission('content.publish')

  if (id) {
    const { error } = await supabase
      .from('course_modules')
      .update(input)
      .eq('id', id)
      .select('id').single()
    if (error) throw new Error('Error updating module')
  } else {
    const courseId = z.string().uuid().parse(data.course_id)
    const { data: last, error: readError } = await supabase.from('course_modules').select('order_index').eq('course_id', courseId).order('order_index', { ascending: false }).limit(1)
    if (readError) throw new Error('Falha ao consultar módulos.')
    const { data: created, error } = await supabase
      .from('course_modules')
      .insert({ ...input, course_id: courseId, order_index: (last?.[0]?.order_index ?? -1) + 1 })
      .select('id').single()
    if (error) throw new Error('Error creating module')
    id = created.id
  }
  refreshCourses()
  return { success: true, id: id! }
}

export async function saveLesson(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()
  const input = z.object({ title: titleSchema, status: statusSchema }).parse(data)
  if (input.status === 'published') {
    await requirePermission('content.publish')
    const { data: lesson } = await supabase.from('lessons').select('type, video_assets(status, playback_policy, mux_playback_id), external_resource_id').eq('id', id || '').maybeSingle()
    const video = lesson?.video_assets as unknown as { status: string; playback_policy: string; mux_playback_id: string } | null
    if (!lesson || (lesson.type === 'video' && (!video || video.status !== 'ready' || video.playback_policy !== 'signed' || !video.mux_playback_id))) throw new Error('Envie e vincule um vídeo pronto antes de publicar a aula.')
  }

  if (id) {
    const { error } = await supabase
      .from('lessons')
      .update({ ...input, is_published: input.status === 'published' })
      .eq('id', id)
      .select('id').single()
    if (error) throw new Error('Error updating lesson')
  } else {
    const moduleId = z.string().uuid().parse(data.module_id)
    const { data: last, error: readError } = await supabase.from('lessons').select('order_index').eq('module_id', moduleId).order('order_index', { ascending: false }).limit(1)
    if (readError) throw new Error('Falha ao consultar aulas.')
    const lessonId = crypto.randomUUID()
    const { error } = await supabase
      .from('lessons')
      .insert({ ...input, id: lessonId, slug: 'aula-' + lessonId, module_id: moduleId, type: 'video', order_index: (last?.[0]?.order_index ?? -1) + 1, is_published: false })
    if (error) throw new Error('Error creating lesson')
    id = lessonId
  }
  refreshCourses()
  return { success: true, id: id! }
}

export async function saveGlobalQuestion(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()

  if (id) {
    const { error } = await supabase
      .from('global_questions')
      .update(data)
      .eq('id', id)
    if (error) throw new Error('Error updating global question')
  } else {
    const { error } = await supabase
      .from('global_questions')
      .insert(data)
    if (error) throw new Error('Error creating global question')
  }
  return { success: true }
}

// ─── Publish Course ───────────────────────────────────────────────────────────

export async function publishCourse(courseId: string, currentVersion: number) {
  await requireAal2()

  if (!(await hasPermission('content.publish'))) {
    throw new Error('Você não tem permissão para publicar cursos.')
  }

  const supabase = await createClient()

  // Optimistic locking via version
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, cover_asset_id, status, version')
    .eq('id', courseId)
    .single()

  if (courseError || !course) throw new Error('Curso não encontrado.')
  if (course.version !== currentVersion) throw new Error('Conflito de edição detectado (versão desatualizada).')
  if (!course.title || !course.slug) throw new Error('Título e Slug são obrigatórios.')

  // Fetch modules and lessons
  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, lessons ( id, type, video_asset_id, external_resource_id, status )')
    .eq('course_id', courseId)
    .eq('status', 'published')

  if (!modules || modules.length === 0) {
    throw new Error('O curso precisa ter pelo menos um módulo publicado.')
  }

  let hasPublishableItem = false

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      if (lesson.status === 'published') {
        hasPublishableItem = true

        if (lesson.type === 'video') {
          if (!lesson.video_asset_id) throw new Error(`Aula de vídeo sem asset associado (ID: ${lesson.id}).`)
          const { data: video } = await supabase.from('video_assets').select('status').eq('id', lesson.video_asset_id).single()
          if (video?.status !== 'ready') throw new Error(`Vídeo da aula não está pronto (Status: ${video?.status}).`)
        }

        if (lesson.type === 'external_link') {
          if (!lesson.external_resource_id) throw new Error(`Aula de link externo sem recurso associado (ID: ${lesson.id}).`)
          const { data: ext } = await supabase.from('external_resources').select('status').eq('id', lesson.external_resource_id).single()
          if (ext?.status !== 'active') throw new Error('Link externo inválido ou inativo.')
        }
      }
    }
  }

  if (!hasPublishableItem) {
    throw new Error('O curso precisa ter pelo menos um item (aula/material) publicável.')
  }

  const { error: updateError } = await supabase
    .from('courses')
    .update({
      status: 'published',
      is_published: true,
      version: course.version + 1
    })
    .eq('id', courseId)
    .eq('version', currentVersion)
    .select('id').single()

  if (updateError) throw new Error('Falha ao publicar curso.')

  await writeAdminAuditEvent({
    action: 'publish_course',
    resourceType: 'course',
    resourceId: courseId,
    details: { previousVersion: course.version }
  })

  refreshCourses()
  return { success: true, newVersion: course.version + 1 }
}

// ─── External Links ───────────────────────────────────────────────────────────

export async function addExternalLink(allowedHostname: string, label: string, url: string) {
  await requireAal2()

  if (!(await hasPermission('content.manage'))) {
    throw new Error('Sem permissão.')
  }

  if (!url.startsWith('https://')) {
    throw new Error('Apenas HTTPS é permitido.')
  }

  try {
    const parsedUrl = new URL(url)
    if (!['wa.me', 'chat.whatsapp.com'].includes(parsedUrl.hostname) && parsedUrl.hostname !== allowedHostname) {
      throw new Error(`Hostname não permitido: ${parsedUrl.hostname}`)
    }
  } catch (e) {
    throw new Error('URL inválida.')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('external_resources')
    .insert({
      allowed_hostname: allowedHostname,
      label,
      private_destination_url: url,
      status: 'active'
    })
    .select()
    .single()

  if (error) throw new Error('Falha ao salvar link externo.')

  await writeAdminAuditEvent({
    action: 'create_external_link',
    resourceType: 'external_resource',
    resourceId: data.id
  })

  return data
}

// ─── Course Access Management ─────────────────────────────────────────────────

export async function grantCourseAccess(
  courseId: string,
  userEmail: string,
  expiresAt: string | null
) {
  await requireAal2()
  await requirePermission('users.manage')
  const supabase = await createClient()

  const emailParsed = z.string().email().parse(userEmail)
  const courseIdParsed = z.string().uuid().parse(courseId)

  // Look up user by email
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('email', emailParsed)
    .maybeSingle()

  if (userError) throw new Error('Erro ao buscar usuário: ' + userError.message)
  if (!userRecord) throw new Error(`Nenhum usuário encontrado com o e-mail "${emailParsed}".`)

  // Check for existing active entitlement
  const { data: existing } = await supabase
    .from('entitlements')
    .select('id, status')
    .eq('profile_id', userRecord.id)
    .eq('resource_id', courseIdParsed)
    .eq('resource_type', 'course')
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    throw new Error(`${emailParsed} já tem acesso ativo a este curso.`)
  }

  // Create entitlement
  const { data: entitlement, error: insertError } = await supabase
    .from('entitlements')
    .insert({
      profile_id: userRecord.id,
      resource_id: courseIdParsed,
      resource_type: 'course',
      status: 'active',
      origin: 'admin_manual',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
    .select(`
      id, profile_id, status, starts_at, expires_at,
      users:profile_id (first_name, last_name, email)
    `)
    .single()

  if (insertError || !entitlement) {
    throw new Error('Não foi possível conceder acesso: ' + (insertError?.message ?? 'erro desconhecido'))
  }

  await writeAdminAuditEvent({
    action: 'grant_course_access',
    resourceType: 'course',
    resourceId: courseIdParsed,
    details: { userId: userRecord.id, userEmail: emailParsed, expiresAt },
  })

  revalidatePath(`/admin/courses/editor/${courseId}`)

  return entitlement
}

export async function revokeCourseAccess(entitlementId: string) {
  await requireAal2()
  await requirePermission('users.manage')
  const supabase = await createClient()

  const idParsed = z.string().uuid().parse(entitlementId)

  const { data: ent, error: findError } = await supabase
    .from('entitlements')
    .select('id, profile_id, resource_id')
    .eq('id', idParsed)
    .single()

  if (findError || !ent) throw new Error('Entitlement não encontrado.')

  const { error: updateError } = await supabase
    .from('entitlements')
    .update({ status: 'revoked' })
    .eq('id', idParsed)

  if (updateError) throw new Error('Não foi possível revogar acesso: ' + updateError.message)

  await writeAdminAuditEvent({
    action: 'revoke_course_access',
    resourceType: 'course',
    resourceId: ent.resource_id,
    details: { userId: ent.profile_id, entitlementId: idParsed },
  })

  revalidatePath(`/admin/courses/editor/${ent.resource_id}`)
}

export async function getCourseAccessList(courseId: string) {
  await requireAal2()
  await requirePermission('users.manage')
  const supabase = await createClient()

  const courseIdParsed = z.string().uuid().parse(courseId)

  const { data, error } = await supabase
    .from('entitlements')
    .select(`
      id, profile_id, status, starts_at, expires_at,
      users:profile_id (first_name, last_name, email)
    `)
    .eq('resource_id', courseIdParsed)
    .eq('resource_type', 'course')
    .order('starts_at', { ascending: false })

  if (error) throw new Error('Não foi possível carregar a lista de acessos: ' + error.message)

  return data ?? []
}
