'use server'

import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export async function saveCourse(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()

  if (id && id !== 'new') {
    const { error } = await supabase
      .from('courses')
      .update(data)
      .eq('id', id)
      
    if (error) throw new Error('Error updating course')
  } else {
    const { error } = await supabase
      .from('courses')
      .insert(data)
      
    if (error) throw new Error('Error creating course')
  }
  return { success: true }
}

export async function saveModule(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()

  if (id) {
    const { error } = await supabase
      .from('course_modules')
      .update(data)
      .eq('id', id)
    if (error) throw new Error('Error updating module')
  } else {
    const { error } = await supabase
      .from('course_modules')
      .insert(data)
    if (error) throw new Error('Error creating module')
  }
  return { success: true }
}

export async function saveLesson(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('courses.manage')
  const supabase = await createClient()

  if (id) {
    const { error } = await supabase
      .from('course_lessons')
      .update(data)
      .eq('id', id)
    if (error) throw new Error('Error updating lesson')
  } else {
    const { error } = await supabase
      .from('course_lessons')
      .insert(data)
    if (error) throw new Error('Error creating lesson')
  }
  return { success: true }
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
