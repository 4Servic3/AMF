import { createCampaign } from '../actions/communications'

export default function CommunicationsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Communications</h1>
      
      <div className="bg-white p-6 rounded shadow max-w-lg">
        <h2 className="text-xl font-semibold mb-4">New Campaign</h2>
        <form action={async (formData) => {
          'use server'
          const name = formData.get('name') as string
          const audience = formData.get('audience') as string
          const channels: ('in_app' | 'email')[] = []
          if (formData.get('channel_in_app')) channels.push('in_app')
          if (formData.get('channel_email')) channels.push('email')
          
          await createCampaign(name, audience, channels)
        }} className="flex flex-col gap-4">
          
          <label className="flex flex-col gap-1">
            <span className="font-medium">Campaign Name</span>
            <input type="text" name="name" required className="border p-2 rounded" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium">Audience</span>
            <select name="audience" required className="border p-2 rounded">
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
            </select>
          </label>

          <fieldset className="border p-4 rounded flex flex-col gap-2">
            <legend className="font-medium px-1">Channels</legend>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="channel_in_app" value="on" className="w-4 h-4" />
              In-app Notification
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="channel_email" value="on" className="w-4 h-4" />
              Email
            </label>
          </fieldset>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700">
            Create Campaign
          </button>
        </form>
      </div>
    </div>
  )
}
