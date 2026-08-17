'use server'

import { requireAal2 } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_CTA_TARGET_TYPES = ['course', 'case', 'lesson', 'subscription_checkout']

export async function saveHomeSection(id: string, data: any, currentVersion: number) {
  await requireAal2()
  const supabase = await createClient()

  const { data: currentItem, error: fetchError } = await supabase
    .from('home_sections')
    .select('version')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Error fetching item')
  if (currentItem.version !== currentVersion) {
    throw new Error('Version mismatch. Someone else might have edited this item.')
  }

  const { error: updateError } = await supabase
    .from('home_sections')
    .update({ ...data, version: currentVersion + 1 })
    .eq('id', id)
    .eq('version', currentVersion)

  if (updateError) throw new Error('Error updating item')
  return { success: true }
}

export async function saveBanner(id: string, data: any, currentVersion: number) {
  await requireAal2()
  
  if (data.cta_target_type && !ALLOWED_CTA_TARGET_TYPES.includes(data.cta_target_type)) {
    throw new Error('Invalid cta_target_type')
  }

  const supabase = await createClient()

  const { data: currentItem, error: fetchError } = await supabase
    .from('banners')
    .select('version')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Error fetching banner')
  if (currentItem.version !== currentVersion) {
    throw new Error('Version mismatch. Someone else might have edited this item.')
  }

  const { error: updateError } = await supabase
    .from('banners')
    .update({ ...data, version: currentVersion + 1 })
    .eq('id', id)
    .eq('version', currentVersion)

  if (updateError) throw new Error('Error updating banner')
  return { success: true }
}

export async function saveCollection(id: string, data: any, currentVersion: number) {
  await requireAal2()
  const supabase = await createClient()

  const { data: currentItem, error: fetchError } = await supabase
    .from('collections')
    .select('version')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Error fetching collection')
  if (currentItem.version !== currentVersion) {
    throw new Error('Version mismatch. Someone else might have edited this item.')
  }

  const { error: updateError } = await supabase
    .from('collections')
    .update({ ...data, version: currentVersion + 1 })
    .eq('id', id)
    .eq('version', currentVersion)

  if (updateError) throw new Error('Error updating collection')
  return { success: true }
}

export async function saveStory(id: string, data: any, currentVersion: number) {
  await requireAal2()
  
  if (data.cta_target_type && !ALLOWED_CTA_TARGET_TYPES.includes(data.cta_target_type)) {
    throw new Error('Invalid cta_target_type')
  }

  const supabase = await createClient()

  const { data: currentItem, error: fetchError } = await supabase
    .from('stories')
    .select('version')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Error fetching story')
  if (currentItem.version !== currentVersion) {
    throw new Error('Version mismatch. Someone else might have edited this item.')
  }

  const { error: updateError } = await supabase
    .from('stories')
    .update({ ...data, version: currentVersion + 1 })
    .eq('id', id)
    .eq('version', currentVersion)

  if (updateError) throw new Error('Error updating story')
  return { success: true }
}
