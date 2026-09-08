import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Acessos | AMF Admin' }

export default async function AccessPage() {
  await requireAal2()
  await requirePermission('users.manage')
  const supabase = await createClient()

  const { data: grants } = await supabase
    .from('access_grants')
    .select('id, user_id, granted_by, reason, expires_at, revoked_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Acessos" description="Concessoes manuais de acesso premium aos usuarios." />
      <div className="bg-white rounded-xl border border-amf-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3 font-medium">Usuario</th>
              <th className="p-3 font-medium">Concedido Por</th>
              <th className="p-3 font-medium">Motivo</th>
              <th className="p-3 font-medium">Expira Em</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {grants?.map((g: any) => (
              <tr key={g.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{g.user_id?.slice(0, 12)}</td>
                <td className="p-3 font-mono text-xs">{g.granted_by?.slice(0, 12)}</td>
                <td className="p-3">{g.reason || '—'}</td>
                <td className="p-3 text-xs text-amf-ink-400">
                  {g.expires_at ? new Date(g.expires_at).toLocaleDateString('pt-BR') : 'Indefinido'}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.revoked_at ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {g.revoked_at ? 'Revogado' : 'Ativo'}
                  </span>
                </td>
              </tr>
            ))}
            {!grants?.length && (
              <tr><td colSpan={5} className="p-8 text-center text-amf-ink-400">Nenhuma concessao encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}