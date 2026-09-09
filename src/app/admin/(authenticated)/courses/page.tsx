import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/ui/PageHeader'
import DataTable from '@/components/admin/ui/DataTable'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import { requireAal2, requirePermission } from '@/lib/auth/dal'

export const metadata = {
  title: 'Courses | AMF Admin',
}

export default async function CoursesPage() {
  await requireAal2()
  await requirePermission('courses.manage')

  const supabase = await createClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      status,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching courses:', error)
    throw new Error('Não foi possível carregar os cursos.')
  }

  const columns = [
    {
      header: 'Curso',
      accessorKey: 'title',
      cell: (row: any) => (
        <Link href={`/admin/courses/editor/${row.id}`} className="font-medium text-amf-teal-600 hover:text-amf-teal-700 hover:underline">
          {row.title}
        </Link>
      )
    },
    {
      header: 'Status',
      cell: (row: any) => {
        const statusMap: Record<string, string> = {
          draft: 'neutral',
          published: 'success',
          archived: 'neutral',
        };
        const variant = (statusMap[row.status] || 'neutral') as any;
        return <StatusBadge variant={variant}>{row.status ? row.status.toUpperCase() : 'DRAFT'}</StatusBadge>
      }
    },
    {
      header: 'Criado em',
      cell: (row: any) => new Date(row.created_at || Date.now()).toLocaleDateString()
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader title="Cursos" description="Cadastre cursos, organize módulos e aulas e envie os vídeos." />
        <Link 
          href="/admin/courses/editor/new"
          className="bg-amf-teal-600 hover:bg-amf-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Novo curso
        </Link>
      </div>

      <DataTable columns={columns} data={courses || []} />
    </div>
  )
}
