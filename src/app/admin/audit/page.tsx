import { createClient } from '@/lib/supabase/server'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { ExportButton } from './ExportButton'

export default async function AuditPage() {
  await requireAal2()
  await requirePermission('audit.read')
  const supabase = await createClient()
  
  const { data: logs } = await supabase.from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <ExportButton />
      </div>
      
      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Time</th>
              <th className="p-3 text-left font-medium">Actor ID</th>
              <th className="p-3 text-left font-medium">Action</th>
              <th className="p-3 text-left font-medium">Resource</th>
              <th className="p-3 text-left font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log: any) => (
              <tr key={log.id} className="border-b">
                <td className="p-3">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-3">{log.actor_id}</td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
                <td className="p-3">{log.resource_type} {log.resource_id ? `(${log.resource_id})` : ''}</td>
                <td className="p-3 max-w-xs truncate">{JSON.stringify(log.details)}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">No logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
