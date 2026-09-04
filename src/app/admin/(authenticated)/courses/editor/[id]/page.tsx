import React from 'react'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import CourseEditorClient from './client'

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAal2()
  await requirePermission('courses.manage')

  const { id } = await params

  const supabase = await createClient()

  let initialData = null

  if (id !== 'new') {
    const { data } = await supabase
      .from('courses')
      .select('*, course_modules(*, lessons(*, video_assets(*)))')
      .eq('id', id)
      .single()
    initialData = data
  }

  return <CourseEditorClient id={id} initialData={initialData} />
}
