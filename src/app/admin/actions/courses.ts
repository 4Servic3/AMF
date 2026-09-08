'use server'

import { requireAal2, requirePermission } from '@/lib/auth/dal'
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

export async function saveCourse(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()

  if (id && id !== 'new') {
    const input = z.object({ title: titleSchema, description: z.string().max(20000).nullable().optional(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }).parse(data)
    const { error } = await supabase
      .from('courses')
      .update(input)
      .eq('id', id)
      .select('id').single()
      
    if (error) throw new Error('Error updating course')
  } else {
    const input = z.object({ title: titleSchema, description: z.string().max(20000).nullable().optional(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }).parse(data)
    const { data: created, error } = await supabase
      .from('courses')
      .insert({ ...input, status: 'draft', is_published: false })
      .select('id').single()
      
    if (error) throw new Error('Error creating course')
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
    const courseId = z.uuid().parse(data.course_id)
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
    const moduleId = z.uuid().parse(data.module_id)
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

export async function publishCourse(courseId: string, currentVersion: number) {
  const session = await requireAal2();
  
  // Need to import writeAdminAuditEvent here or dynamically
  const { writeAdminAuditEvent, hasPermission } = await import('@/lib/auth/dal');
  const { revalidatePath } = await import('next/cache');

  if (!(await hasPermission('content.publish'))) {
    throw new Error('Você não tem permissão para publicar cursos.');
  }

  const supabase = await createClient();

  // Optimistic locking via version
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, cover_asset_id, status, version')
    .eq('id', courseId)
    .single();

  if (courseError || !course) throw new Error('Curso não encontrado.');
  if (course.version !== currentVersion) throw new Error('Conflito de edição detectado (versão desatualizada).');

  if (!course.title || !course.slug) throw new Error('Título e Slug são obrigatórios.');

  // Fetch modules and lessons
  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, lessons ( id, type, video_asset_id, external_resource_id, status )')
    .eq('course_id', courseId)
    .eq('status', 'published');

  if (!modules || modules.length === 0) {
    throw new Error('O curso precisa ter pelo menos um módulo publicado.');
  }

  let hasPublishableItem = false;

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      if (lesson.status === 'published') {
        hasPublishableItem = true;

        if (lesson.type === 'video') {
          if (!lesson.video_asset_id) throw new Error(`Aula de vídeo sem asset associado (ID: ${lesson.id}).`);
          const { data: video } = await supabase.from('video_assets').select('status').eq('id', lesson.video_asset_id).single();
          if (video?.status !== 'ready') throw new Error(`Vídeo da aula não está pronto (Status: ${video?.status}).`);
        }

        if (lesson.type === 'external_link') {
          if (!lesson.external_resource_id) throw new Error(`Aula de link externo sem recurso associado (ID: ${lesson.id}).`);
          const { data: ext } = await supabase.from('external_resources').select('status').eq('id', lesson.external_resource_id).single();
          if (ext?.status !== 'active') throw new Error('Link externo inválido ou inativo.');
        }
      }
    }
  }

  if (!hasPublishableItem) {
    throw new Error('O curso precisa ter pelo menos um item (aula/material) publicável.');
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
    .select('id').single();

  if (updateError) throw new Error('Falha ao publicar curso.');

  await writeAdminAuditEvent({
    action: 'publish_course',
    resourceType: 'course',
    resourceId: courseId,
    details: { previousVersion: course.version }
  });

  refreshCourses();
  return { success: true, newVersion: course.version + 1 };
}

export async function addExternalLink(allowedHostname: string, label: string, url: string) {
  const session = await requireAal2();
  const { writeAdminAuditEvent, hasPermission } = await import('@/lib/auth/dal');
  
  if (!(await hasPermission('content.manage'))) {
    throw new Error('Sem permissão.');
  }

  if (!url.startsWith('https://')) {
    throw new Error('Apenas HTTPS é permitido.');
  }

  try {
    const parsedUrl = new URL(url);
    if (!['wa.me', 'chat.whatsapp.com'].includes(parsedUrl.hostname) && parsedUrl.hostname !== allowedHostname) {
      throw new Error(`Hostname não permitido: ${parsedUrl.hostname}`);
    }
  } catch (e) {
    throw new Error('URL inválida.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('external_resources')
    .insert({
      allowed_hostname: allowedHostname,
      label,
      private_destination_url: url,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw new Error('Falha ao salvar link externo.');

  await writeAdminAuditEvent({
    action: 'create_external_link',
    resourceType: 'external_resource',
    resourceId: data.id
  });

  return data;
}
