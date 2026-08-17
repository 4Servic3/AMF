'use server'

import { requirePermission, requireAal2, writeAdminAuditEvent } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export async function exportAuditLogsCSV(): Promise<string> {
  await requireAal2()
  await requirePermission('audit.read')
  const supabase = await createClient()
  
  const { data, error } = await supabase.from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)
    
  if (error) throw new Error(error.message)
    
  await writeAdminAuditEvent({
    action: 'export_audit_logs',
    resourceType: 'audit',
    reason: 'Data Export'
  })
  
  if (!data || data.length === 0) return ''
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => 
    Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  
  return `${headers}\n${rows}`
}
