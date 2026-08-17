import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/ui/PageHeader'
import DataTable from '@/components/admin/ui/DataTable'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import { requireAal2, requirePermission } from '@/lib/auth/dal'

export const metadata = {
  title: 'Clinical Cases | AMF Admin',
}

export default async function CasesPage() {
  await requireAal2()
  await requirePermission('cases.manage')

  const supabase = await createClient()

  const { data: cases, error } = await supabase
    .from('cases')
    .select(`
      id,
      title,
      status,
      difficulty,
      author_id,
      created_at
    `)
    .order('created_at', { ascending: false })

  let casesWithAuthors = cases || [];
  if (casesWithAuthors.length > 0) {
    const authorIds = Array.from(new Set(casesWithAuthors.map((c: any) => c.author_id).filter(Boolean)));
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').in('id', authorIds);
    const profilesMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});
    
    casesWithAuthors = casesWithAuthors.map((c: any) => ({
      ...c,
      author: profilesMap[c.author_id] || { email: 'Unknown', full_name: 'Unknown' }
    }));
  }

  if (error) {
    console.error('Error fetching cases:', error)
  }

  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: (row: any) => (
        <Link href={`/admin/cases/editor/${row.id}`} className="font-medium text-amf-teal-600 hover:text-amf-teal-700 hover:underline">
          {row.title}
        </Link>
      )
    },
    {
      header: 'Author',
      cell: (row: any) => row.author?.email || 'Unknown'
    },
    {
      header: 'Difficulty',
      cell: (row: any) => `${row.difficulty || '-'}/5`
    },
    {
      header: 'Status',
      cell: (row: any) => {
        const statusMap: Record<string, string> = {
          draft: 'neutral',
          in_review: 'info',
          changes_requested: 'warning',
          approved: 'success',
          scheduled: 'info',
          published: 'success',
          archived: 'neutral',
        };
        const variant = (statusMap[row.status] || 'neutral') as any;
        return <StatusBadge variant={variant}>{row.status.replace('_', ' ').toUpperCase()}</StatusBadge>
      }
    },
    {
      header: 'Created At',
      cell: (row: any) => new Date(row.created_at).toLocaleDateString()
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader title="Clinical Cases" description="Manage and review clinical cases for the platform." />
        <Link 
          href="/admin/cases/editor/new"
          className="bg-amf-teal-600 hover:bg-amf-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Create Case
        </Link>
      </div>

      <DataTable columns={columns} data={casesWithAuthors} />
    </div>
  )
}
