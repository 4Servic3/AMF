import React from 'react'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/ui/PageHeader'
import DataTable from '@/components/admin/ui/DataTable'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import CertificatesClient from './client'

export const metadata = {
  title: 'Certificates | AMF Admin',
}

export default async function CertificatesPage() {
  await requireAal2()
  await requirePermission('academy.manage')

  const supabase = await createClient()

  const { data: certificates, error } = await supabase
    .from('certificates')
    .select(`
      id,
      validation_code,
      status,
      issued_at,
      revoked_at,
      profile:profiles(full_name, email),
      course:courses(title),
      case:cases(title),
      path:academy_paths(title)
    `)
    .order('issued_at', { ascending: false })
    .limit(100) // limit for safety

  if (error) {
    console.error('Error fetching certificates:', error)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader title="Certificates" description="Manage issued certificates and revocations." />
      </div>

      <CertificatesClient initialData={certificates || []} />
    </div>
  )
}
