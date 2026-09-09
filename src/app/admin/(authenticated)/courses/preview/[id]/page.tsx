import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAal2()
  await requirePermission('courses.manage')

  const { id } = await params

  const supabase = await createClient()

  // Admin bypass: fetch course regardless of status (RLS allows via courses.manage)
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id, title, slug, short_description, workload, status,
      cover:media_assets!cover_asset_id(object_path, bucket)
    `)
    .eq('id', id)
    .single()

  if (error || !course) notFound()

  // Build cover URL
  let coverUrl: string | null = null
  const coverRaw = Array.isArray(course.cover) ? course.cover[0] : course.cover
  if (coverRaw?.file_path) {
    const { data: urlData } = supabaseAdmin.storage
      .from('public_media')
      .getPublicUrl(coverRaw.file_path)
    coverUrl = urlData.publicUrl
  }

  const { data: modulesData } = await supabaseAdmin
    .from('course_modules')
    .select(`
      id, title, order_index, status,
      lessons (id, title, type, order_index, status, video_asset_id)
    `)
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  const modules = (modulesData ?? []).map((mod: any) => ({
    ...mod,
    lessons: [...(mod.lessons ?? [])].sort((a: any, b: any) => a.order_index - b.order_index),
  }))

  const isDraft = course.status !== 'published'

  return (
    <div className="min-h-screen bg-amf-ivory-50">
      {/* Admin preview banner */}
      <div className={`w-full px-4 py-3 text-center text-sm font-medium ${
        isDraft
          ? 'bg-amber-400 text-amber-950'
          : 'bg-green-500 text-white'
      }`}>
        {isDraft ? (
          <>
            👁 <strong>Visualização Admin — RASCUNHO</strong> · Este curso não está visível para alunos ainda.{' '}
            <Link
              href={`/admin/courses/editor/${id}`}
              className="underline hover:no-underline ml-1"
            >
              ← Voltar ao editor
            </Link>
          </>
        ) : (
          <>
            ✅ <strong>Visualização Admin — PUBLICADO</strong> · Esta é a visão que os alunos com acesso têm.{' '}
            <Link
              href={`/admin/courses/editor/${id}`}
              className="underline hover:no-underline ml-1"
            >
              ← Voltar ao editor
            </Link>
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Course header */}
        <div className="space-y-4">
          {coverUrl && (
            <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt={`Capa de ${course.title}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isDraft
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {isDraft ? 'RASCUNHO' : 'PUBLICADO'}
              </span>
              {course.workload && (
                <span className="text-sm text-amf-muted-600">
                  ⏱ {Math.round(course.workload / 60)}h de conteúdo
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-amf-ink-900">{course.title}</h1>
            {course.short_description && (
              <p className="text-amf-muted-600">{course.short_description}</p>
            )}
          </div>
        </div>

        {/* Modules and lessons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-amf-ink-900">Conteúdo do curso</h2>
          {modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amf-border px-6 py-10 text-center text-amf-muted-600 text-sm">
              Nenhum módulo adicionado ainda.
            </div>
          ) : (
            modules.map((mod: any, idx: number) => (
              <div key={mod.id} className="rounded-xl border border-amf-border bg-white overflow-hidden">
                <div className="px-5 py-4 bg-amf-ivory-50 border-b border-amf-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amf-muted-600 uppercase tracking-wider">
                      Módulo {idx + 1}
                    </p>
                    <h3 className="font-semibold text-amf-ink-900">{mod.title}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    mod.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {mod.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <div className="divide-y divide-amf-border">
                  {mod.lessons.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-amf-muted-600">Sem aulas neste módulo.</p>
                  ) : (
                    mod.lessons.map((lesson: any, lIdx: number) => (
                      <div key={lesson.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-amf-ivory-100 border border-amf-border flex items-center justify-center shrink-0">
                            {lesson.type === 'video' ? (
                              <svg className="w-3.5 h-3.5 text-amf-petrol-700" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-amf-petrol-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-amf-ink-900 truncate">{lesson.title}</span>
                        </div>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          lesson.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lesson.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
