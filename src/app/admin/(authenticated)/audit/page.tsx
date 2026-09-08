import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ExportButton } from './ExportButton'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Auditoria | AMF Admin' }

export default async function AuditPage() {
  await requireAal2()
  await requirePermission('audit.read')
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader title="Auditoria" description="Registro de todas as acoes administrativas." />
        <ExportButton />
      </div>
      <div className="bg-white rounded-xl border border-amf-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3 font-medium">Data/Hora</th>
              <th className="p-3 font-medium">Ator</th>
              <th className="p-3 font-medium">Acao</th>
              <th className="p-3 font-medium">Recurso</th>
              <th className="p-3 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log: any) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3 text-xs text-amf-ink-400">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                <td className="p-3 font-mono text-xs">{log.actor_id?.slice(0, 8)}</td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
                <td className="p-3">{log.resource_type} {log.resource_id ? `(${log.resource_id.slice(0, 8)})` : ''}</td>
                <td className="p-3 max-w-xs truncate text-xs text-amf-ink-400">{JSON.stringify(log.details)}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr><td colSpan={5} className="p-8 text-center text-amf-ink-400">Nenhum log encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}