import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Seguranca | AMF Admin' }

export default async function SecurityPage() {
  await requireAal2()
  await requirePermission('settings.manage')
  const supabase = await createClient()

  const { data: recentLogins } = await supabase
    .from('admin_audit_logs')
    .select('actor_id, action, created_at, details')
    .in('action', ['login', 'mfa_challenge_succeeded', 'logout'])
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader title="Seguranca" description="Sessoes, autenticacao e auditoria de acesso." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-amf-border p-5">
          <p className="text-xs font-medium text-amf-ink-400 uppercase tracking-wider mb-1">Autenticacao</p>
          <p className="text-lg font-semibold">MFA Obrigatorio</p>
          <p className="text-sm text-amf-ink-400 mt-1">AAL2 exigido em todas as sessoes admin</p>
        </div>
        <div className="bg-white rounded-xl border border-amf-border p-5">
          <p className="text-xs font-medium text-amf-ink-400 uppercase tracking-wider mb-1">Acesso</p>
          <p className="text-lg font-semibold">RBAC Ativo</p>
          <p className="text-sm text-amf-ink-400 mt-1">Controle por roles e permissions granulares</p>
        </div>
        <div className="bg-white rounded-xl border border-amf-border p-5">
          <p className="text-xs font-medium text-amf-ink-400 uppercase tracking-wider mb-1">Auditoria</p>
          <p className="text-lg font-semibold">Logs Habilitados</p>
          <p className="text-sm text-amf-ink-400 mt-1">Todas as acoes admin sao registradas</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-amf-border overflow-hidden">
        <div className="p-4 border-b border-amf-border">
          <h2 className="text-sm font-semibold">Atividade de Acesso Recente</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3 font-medium">Data/Hora</th>
              <th className="p-3 font-medium">Ator</th>
              <th className="p-3 font-medium">Evento</th>
            </tr>
          </thead>
          <tbody>
            {recentLogins?.map((log: any, i: number) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3 text-xs text-amf-ink-400">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                <td className="p-3 font-mono text-xs">{log.actor_id?.slice(0, 12)}</td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
              </tr>
            ))}
            {!recentLogins?.length && (
              <tr><td colSpan={3} className="p-8 text-center text-amf-ink-400">Nenhum evento de acesso registrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}