import React from 'react'
import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PageHeader from '@/components/admin/ui/PageHeader'
import DataTable from '@/components/admin/ui/DataTable'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import { requireAal2, requirePermission } from '@/lib/auth/dal'

export const metadata = {
  title: 'Cursos | AMF Admin',
}

export default async function CoursesPage() {
  await requireAal2()
  await requirePermission('courses.manage')

  // Use service role so admin sees ALL courses regardless of status (draft, archived etc.)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: courses, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, status, created_at, slug')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching courses:', error)
    throw new Error('Não foi possível carregar os cursos.')
  }

  const statusVariantMap: Record<string, 'success' | 'warning' | 'neutral'> = {
    published: 'success',
    draft: 'warning',
    archived: 'neutral',
  }

  const statusLabelMap: Record<string, string> = {
    published: 'Publicado',
    draft: 'Rascunho',
    archived: 'Arquivado',
  }

  const columns = [
    {
      header: 'Curso',
      accessorKey: 'title',
      cell: (row: any) => (
        <Link
          href={`/admin/courses/editor/${row.id}`}
          className="font-medium text-amf-petrol-900 hover:text-amf-petrol-700 hover:underline"
        >
          {row.title}
        </Link>
      )
    },
    {
      header: 'Status',
      cell: (row: any) => {
        const status = row.status || 'draft'
        const variant = statusVariantMap[status] ?? 'neutral'
        const label = statusLabelMap[status] ?? status.toUpperCase()
        return <StatusBadge variant={variant}>{label}</StatusBadge>
      }
    },
    {
      header: 'Slug',
      cell: (row: any) => (
        <span className="text-xs text-amf-muted-600 font-mono">{row.slug || '—'}</span>
      )
    },
    {
      header: 'Criado em',
      cell: (row: any) =>
        new Date(row.created_at || Date.now()).toLocaleDateString('pt-BR')
    },
    {
      header: 'Ações',
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/courses/editor/${row.id}`}
            className="text-sm text-amf-petrol-900 hover:text-amf-petrol-700 font-medium hover:underline"
          >
            Editar
          </Link>
          <Link
            href={`/admin/courses/preview/${row.id}`}
            className="text-sm text-amf-muted-600 hover:text-amf-ink-700 hover:underline"
          >
            Preview
          </Link>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Cursos"
        description="Cadastre cursos, organize módulos e aulas e envie os vídeos."
        actions={
          <Link
            href="/admin/courses/editor/new"
            className="inline-flex items-center gap-2 bg-amf-petrol-900 hover:bg-amf-petrol-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo curso
          </Link>
        }
      />

      {(!courses || courses.length === 0) ? (
        <div className="rounded-xl border border-dashed border-amf-border bg-white px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amf-ivory-100 border border-amf-border flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amf-muted-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-amf-ink-900 font-semibold mb-1">Nenhum curso cadastrado</h3>
          <p className="text-amf-muted-600 text-sm mb-6">
            Comece criando o primeiro curso da plataforma.
          </p>
          <Link
            href="/admin/courses/editor/new"
            className="inline-flex items-center gap-2 bg-amf-petrol-900 hover:bg-amf-petrol-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar primeiro curso
          </Link>
        </div>
      ) : (
        <DataTable columns={columns} data={courses} />
      )}
    </div>
  )
}
