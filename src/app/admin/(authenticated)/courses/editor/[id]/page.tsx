import React from 'react'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import CourseEditorClient from './client'
import { notFound } from 'next/navigation'

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAal2()
  await requirePermission('courses.manage')

  const { id } = await params

  const supabase = await createClient()

  let initialData = null

  if (id !== 'new') {
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_modules(*, lessons(*, video_assets(*)))')
      .eq('id', id)
      .order('order_index', { referencedTable: 'course_modules', ascending: true })
      .order('order_index', { referencedTable: 'course_modules.lessons', ascending: true })
      .single()
    if (error || !data) notFound()
    initialData = data
  }

  return <CourseEditorClient id={id} initialData={initialData} />
}
