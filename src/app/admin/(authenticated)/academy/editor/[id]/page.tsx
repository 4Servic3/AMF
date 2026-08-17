import React from 'react'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import AcademyEditorClient from './client'

export default async function AcademyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAal2()
  await requirePermission('academy.manage')

  const { id } = await params

  const supabase = await createClient()

  let initialData = null

  if (id !== 'new') {
    const { data } = await supabase
      .from('academy_paths')
      .select('*, phases:academy_phases(*, steps:academy_steps(*, prerequisites:academy_prerequisites(*)))')
      .eq('id', id)
      .single()
    initialData = data
  }

  return <AcademyEditorClient id={id} initialData={initialData} />
}
