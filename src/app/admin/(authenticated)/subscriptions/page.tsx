import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Assinaturas | AMF Admin' }

export default async function SubscriptionsPage() {
  await requireAal2()
  await requirePermission('users.manage')
  const supabase = await createClient()

  const { data: grants } = await supabase
    .from('access_grants')
    .select('id, user_id, granted_by, reason, expires_at, revoked_at, created_at')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Assinaturas" description="Acessos ativos e historico de assinaturas." />
      <div className="bg-white rounded-xl border border-amf-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3 font-medium">Usuario</th>
              <th className="p-3 font-medium">Concedido em</th>
              <th className="p-3 font-medium">Expiracao</th>
              <th className="p-3 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {grants?.map((g: any) => (
              <tr key={g.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{g.user_id?.slice(0, 16)}</td>
                <td className="p-3 text-xs text-amf-ink-400">{new Date(g.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="p-3 text-xs">
                  {g.expires_at ? new Date(g.expires_at).toLocaleDateString('pt-BR') : <span className="text-green-600">Vitalicio</span>}
                </td>
                <td className="p-3 text-sm text-amf-ink-500">{g.reason || '—'}</td>
              </tr>
            ))}
            {!grants?.length && (
              <tr><td colSpan={4} className="p-8 text-center text-amf-ink-400">Nenhuma assinatura ativa.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}