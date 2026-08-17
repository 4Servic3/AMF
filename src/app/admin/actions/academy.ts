'use server'

import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export async function saveAcademyPath(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('academy.manage')
  const supabase = await createClient()

  if (id && id !== 'new') {
    const { error } = await supabase
      .from('academy_paths')
      .update(data)
      .eq('id', id)
      
    if (error) throw new Error('Error updating academy path: ' + error.message)
  } else {
    const { error } = await supabase
      .from('academy_paths')
      .insert(data)
      
    if (error) throw new Error('Error creating academy path: ' + error.message)
  }
  return { success: true }
}

export async function savePhase(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('academy.manage')
  const supabase = await createClient()

  if (id && id !== 'new') {
    const { error } = await supabase
      .from('academy_phases')
      .update(data)
      .eq('id', id)
    if (error) throw new Error('Error updating phase: ' + error.message)
  } else {
    const { error } = await supabase
      .from('academy_phases')
      .insert(data)
    if (error) throw new Error('Error creating phase: ' + error.message)
  }
  return { success: true }
}

export async function saveStep(id: string | null, data: any) {
  await requireAal2()
  await requirePermission('academy.manage')
  const supabase = await createClient()

  if (id && id !== 'new') {
    const { error } = await supabase
      .from('academy_steps')
      .update(data)
      .eq('id', id)
    if (error) throw new Error('Error updating step: ' + error.message)
  } else {
    const { error } = await supabase
      .from('academy_steps')
      .insert(data)
    if (error) throw new Error('Error creating step: ' + error.message)
  }
  return { success: true }
}

export async function savePrerequisite(data: any) {
  await requireAal2()
  await requirePermission('academy.manage')
  const supabase = await createClient()

  if (data.step_id === data.prerequisite_step_id) {
    throw new Error('A step cannot be a prerequisite of itself')
  }

  const { error } = await supabase
    .from('academy_prerequisites')
    .insert(data)
    
  if (error) throw new Error('Error creating prerequisite: ' + error.message)

  return { success: true }
}
