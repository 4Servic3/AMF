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
  const session = await requireAal2()
  await requirePermission('content.publish')
  const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
  const { data, error } = await createServiceRoleClient().rpc('publish_course_bundle', {
    p_course: z.string().uuid().parse(courseId), p_actor: session.user.id,
    p_version: z.number().int().parse(currentVersion),
  })
  if (error) return { success: false, error: error.code === 'P0001' ? error.message : 'Não foi possível publicar. Tente novamente.' }
  refreshCourses()
  return { success: true, newVersion: data }
}

export async function scheduleCourse(courseId: string, currentVersion: number, publishAt: string | null) {
  const session = await requireAal2()
  await requirePermission('content.publish')
  const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
  const { error } = await createServiceRoleClient().rpc('schedule_course_publication', {
    p_course: z.string().uuid().parse(courseId), p_actor: session.user.id,
    p_version: z.number().int().parse(currentVersion),
    p_at: publishAt === null ? null : z.string().datetime().parse(publishAt),
  })
  if (error) return { success: false, error: error.code === 'P0001' ? error.message : 'Não foi possível agendar. Tente novamente.' }
  refreshCourses()
  return { success: true }
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

async function manageCourseAccess(courseId: string, changes: Record<string, unknown> = {}) {
  const session = await requireAal2()
  await requirePermission('users.manage')
  const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
  const { data, error } = await createServiceRoleClient().rpc('course_access_admin', {
    p_course: z.string().uuid().parse(courseId), p_actor: session.user.id, ...changes,
  })
  if (error) return { success: false as const, error: error.code === 'P0001' ? error.message : 'Não foi possível atualizar o acesso. Tente novamente.' }
  if (Object.keys(changes).length) refreshCourses()
  return { success: true as const, entitlements: data ?? [] }
}

export async function grantCourseAccess(courseId: string, email: string, expiresAt: string | null) {
  const parsed = z.string().trim().email().safeParse(email)
  if (!parsed.success) return { success: false as const, error: 'Informe um e-mail válido.' }
  let expiry: string | null = null
  if (expiresAt) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) return { success: false as const, error: 'Data inválida.' }
    const date = new Date(expiresAt + 'T23:59:59-03:00')
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) return { success: false as const, error: 'Escolha uma data de expiração futura.' }
    expiry = date.toISOString()
  }
  return manageCourseAccess(courseId, { p_email: parsed.data.toLowerCase(), p_expires: expiry })
}

export async function revokeCourseAccess(courseId: string, entitlementId: string) {
  return manageCourseAccess(courseId, { p_revoke: z.string().uuid().parse(entitlementId) })
}

export async function setCourseAllStudents(courseId: string, enabled: boolean) {
  return manageCourseAccess(courseId, { p_all: z.boolean().parse(enabled) })
}

export async function getCourseAccessList(courseId: string) {
  const result = await manageCourseAccess(courseId)
  if (!result.success) throw new Error(result.error)
  return result.entitlements
}
