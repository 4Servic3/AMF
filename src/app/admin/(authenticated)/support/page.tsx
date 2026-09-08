import { requireAal2, requirePermission } from '@/lib/auth/dal'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Suporte | AMF Admin' }

export default async function SupportPage() {
  await requireAal2()
  await requirePermission('support.manage')
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(50)

  const statusColor: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="Suporte" description="Tickets abertos e histórico de atendimento." />
      <div className="bg-white rounded-xl border border-amf-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amf-border bg-gray-50 text-left">
              <th className="p-4 font-medium text-amf-ink-600">ID</th>
              <th className="p-4 font-medium text-amf-ink-600">Assunto</th>
              <th className="p-4 font-medium text-amf-ink-600">Status</th>
              <th className="p-4 font-medium text-amf-ink-600">Data</th>
              <th className="p-4 font-medium text-amf-ink-600">Ação</th>
            </tr>
          </thead>
          <tbody>
            {tickets?.map((ticket: any) => (
              <tr key={ticket.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-mono text-xs text-amf-ink-400">{ticket.id.slice(0, 8)}</td>
                <td className="p-4">{ticket.subject}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[ticket.status] || 'bg-gray-100 text-gray-500'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4 text-amf-ink-400">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="p-4">
                  <Link href={`/admin/support/${ticket.id}`} className="text-amf-teal-600 hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {!tickets?.length && (
              <tr><td colSpan={5} className="p-8 text-center text-amf-ink-400">Nenhum ticket encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
