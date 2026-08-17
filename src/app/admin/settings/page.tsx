import { saveSetting, forceLogoutAllUsers } from '../actions/settings'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
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
