import { saveSetting, forceLogoutAllUsers } from '../actions/settings'
import { getFeatureFlags } from '@/lib/services/flags'
import { FeatureFlagToggle } from '@/components/admin/feature-flag-toggle'

export default async function SettingsPage() {
  const flags = await getFeatureFlags()

  const flagEntries = [
    { key: 'member_courses_enabled', desc: 'Acesso aos cursos', enabled: flags.member_courses_enabled },
    { key: 'member_cases_enabled', desc: 'Acesso aos casos clínicos', enabled: flags.member_cases_enabled },
    { key: 'member_stories_enabled', desc: 'Acesso aos stories da home', enabled: flags.member_stories_enabled },
    { key: 'member_close_friends_enabled', desc: 'Acesso ao close friends', enabled: flags.member_close_friends_enabled },
    { key: 'member_home_news_enabled', desc: 'Acesso às novidades na home', enabled: flags.member_home_news_enabled },
    { key: 'member_academy_enabled', desc: 'Acesso à academia flutuante', enabled: flags.member_academy_enabled },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recursos do Membro (Feature Flags)</h2>
        <div className="grid gap-4">
          {flagEntries.map(f => (
            <FeatureFlagToggle key={f.key} flagKey={f.key} description={f.desc} enabled={f.enabled} />
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
        <form action={async (formData) => {
          'use server'
          const mode = formData.get('maintenance_mode') === 'on'
          await saveSetting('maintenance_mode', mode)
        }}>
          <label className="flex items-center gap-2 mb-4">
            <input type="checkbox" name="maintenance_mode" value="on" className="w-5 h-5" />
            <span>Enable Maintenance Mode</span>
          </label>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            Save Setting
          </button>
        </form>
      </div>

      <div className="bg-red-50 p-6 rounded border border-red-200">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Danger Zone</h2>
        <p className="mb-4 text-red-600">This will invalidate all user sessions and force them to login again.</p>
        <form action={forceLogoutAllUsers}>
          <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Force Logout Everyone
          </button>
        </form>
      </div>
    </div>
  )
}
