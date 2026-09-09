import React from 'react'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import CourseEditorClient from './client'
import { notFound } from 'next/navigation'
import { getCourseAccessList } from '@/app/admin/actions/courses'

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAal2()
  await requirePermission('courses.manage')

  const { id } = await params

  let initialData = null
  let coverUrl: string | null = null
  let accessList: any[] = []

  if (id !== 'new') {
    // Validate UUID format before querying
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(id)) {
      notFound()
    }

    // Use service role client so admin can always load any course
    // regardless of its publish status. The requirePermission('courses.manage')
    // above already gates this endpoint — no RLS needed here on top of that.
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        cover:media_assets!cover_asset_id(id, file_path),
        course_modules(
          *,
          lessons(*, video_assets(*))
        )
      `)
      .eq('id', id)
      .order('order_index', { referencedTable: 'course_modules', ascending: true })
      .order('order_index', { referencedTable: 'course_modules.lessons', ascending: true })
      .single()

    // If there is ANY error other than 'not found' (PGRST116), throw it so we can see it
    if (error && error.code !== 'PGRST116') {
      console.error('SUPABASE QUERY ERROR IN COURSE EDITOR:', error)
      throw new Error(`Erro ao carregar curso (${error.code}): ${error.message}`)
    }

    // If not found in DB at all, show admin 404
    if (error?.code === 'PGRST116' || !data) {
      console.error(`COURSE NOT FOUND: id=${id}`, error)
      notFound()
    }

    // Build public cover URL if cover asset exists
    if (data.cover) {
      const cover = Array.isArray(data.cover) ? data.cover[0] : data.cover
      // We assume bucket 'public_media' as it is standard in the app for covers
      if (cover?.file_path) {
        // Use a regular Supabase client just for the public URL (no auth needed)
        const supabasePublic = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: urlData } = supabasePublic.storage
          .from('public_media')
          .getPublicUrl(cover.file_path)
        coverUrl = urlData.publicUrl
      }
    }

    initialData = data

    // Load access list (never break the editor if this fails)
    try {
      accessList = await getCourseAccessList(id)
    } catch {
      accessList = []
    }
  }

  return (
    <CourseEditorClient
      id={id}
      initialData={initialData}
      initialCoverUrl={coverUrl}
      initialAccessList={accessList}
    />
  )
}
