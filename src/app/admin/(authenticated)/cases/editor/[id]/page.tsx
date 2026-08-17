import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireAal2, requirePermission } from '@/lib/auth/dal';
import CaseEditorForm from './CaseEditorForm';

export const metadata = {
  title: 'Edit Case | AMF Admin',
}

export default async function CaseEditorPage({ params }: { params: { id: string } }) {
  await requireAal2()
  await requirePermission('cases.manage')

  let initialData = null;

  if (params.id !== 'new') {
    const supabase = await createClient()
    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching case:', error)
    } else {
      initialData = caseData;
    }
  }

  return (
    <div className="pb-24">
      <CaseEditorForm caseId={params.id} initialData={initialData} />
    </div>
  )
}
