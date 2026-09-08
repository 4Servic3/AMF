import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { saveSetting, forceLogoutAllUsers } from '../../actions/settings'
import { getFeatureFlags } from '@/lib/services/flags'
import { FeatureFlagToggle } from '@/components/admin/feature-flag-toggle'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Configuracoes | AMF Admin' }

export default async function SettingsPage() {
  await requireAal2()
  await requirePermission('settings.manage')
  const flags = await getFeatureFlags()

  const flagEntries = [
    { key: 'member_courses_enabled', desc: 'Acesso aos cursos', enabled: flags.member_courses_enabled },
    { key: 'member_cases_enabled', desc: 'Acesso aos casos clinicos', enabled: flags.member_cases_enabled },
    { key: 'member_stories_enabled', desc: 'Acesso aos stories da home', enabled: flags.member_stories_enabled },
    { key: 'member_close_friends_enabled', desc: 'Acesso ao close friends', enabled: flags.member_close_friends_enabled },
    { key: 'member_home_news_enabled', desc: 'Acesso as novidades na home', enabled: flags.member_home_news_enabled },
    { key: 'member_academy_enabled', desc: 'Acesso a academia flutuante', enabled: flags.member_academy_enabled },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Configuracoes" description="Gerencie feature flags e configuracoes do sistema." />
      <div className="bg-white rounded-xl border border-amf-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Recursos do Membro</h2>
        <div className="grid gap-4">
          {flagEntries.map(f => (
            <FeatureFlagToggle key={f.key} flagKey={f.key} description={f.desc} enabled={f.enabled} />
          ))}
        </div>
      </div>
      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Zona de Risco</h2>
        <p className="mb-4 text-red-600 text-sm">Invalida todas as sessoes ativas e forca reautenticacao.</p>
        <form action={forceLogoutAllUsers}>
          <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
            Desconectar Todos os Usuarios
          </button>
        </form>
      </div>
    </div>
  )
}