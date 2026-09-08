import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { reprocessWebhook, requeueJob } from '../../actions/ops'
import PageHeader from '@/components/admin/ui/PageHeader'
import { RefreshCw } from 'lucide-react'

export const metadata = { title: 'Operacoes | AMF Admin' }

export default async function OperationsPage() {
  await requireAal2()
  await requirePermission('ops.manage')
  const supabase = await createClient()

  const { data: webhooks } = await supabase.from('webhook_events').select('*').order('created_at', { ascending: false }).limit(20)
  const { data: jobs } = await supabase.from('background_jobs').select('*').order('created_at', { ascending: false }).limit(20)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader title="Monitoramento" description="Webhooks recebidos e jobs em background." />

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Webhooks Recentes</h2>
        <div className="bg-white rounded-xl border border-amf-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Evento</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {webhooks?.map((wh: any) => (
                <tr key={wh.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{wh.id?.slice(0, 8)}</td>
                  <td className="p-3">{wh.event_type}</td>
                  <td className="p-3">{wh.status}</td>
                  <td className="p-3 text-right">
                    <form action={reprocessWebhook.bind(null, wh.id)}>
                      <button className="inline-flex items-center gap-1 border border-amf-border rounded-lg px-3 py-1.5 text-xs hover:bg-gray-50">
                        <RefreshCw className="w-3 h-3" /> Reprocessar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!webhooks?.length && (
                <tr><td colSpan={4} className="p-6 text-center text-amf-ink-400">Nenhum webhook encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Jobs em Background</h2>
        <div className="bg-white rounded-xl border border-amf-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {jobs?.map((job: any) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{job.id?.slice(0, 8)}</td>
                  <td className="p-3">{job.name}</td>
                  <td className="p-3">{job.status}</td>
                  <td className="p-3 text-right">
                    <form action={requeueJob.bind(null, job.id)}>
                      <button className="inline-flex items-center gap-1 border border-amf-border rounded-lg px-3 py-1.5 text-xs hover:bg-gray-50">
                        <RefreshCw className="w-3 h-3" /> Recolocar na Fila
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!jobs?.length && (
                <tr><td colSpan={4} className="p-6 text-center text-amf-ink-400">Nenhum job encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}