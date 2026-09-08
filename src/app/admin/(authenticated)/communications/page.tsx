import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createCampaign } from '../../actions/communications'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Notificacoes | AMF Admin' }

export default async function CommunicationsPage() {
  await requireAal2()
  await requirePermission('communications.manage')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Notificacoes" description="Crie campanhas de notificacao para os usuarios." />
      <div className="bg-white p-6 rounded-xl border border-amf-border">
        <h2 className="text-base font-semibold mb-4">Nova Campanha</h2>
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
            <span className="text-sm font-medium">Nome da Campanha</span>
            <input type="text" name="name" required className="border border-amf-border p-2 rounded-lg text-sm" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Audiencia</span>
            <select name="audience" required className="border border-amf-border p-2 rounded-lg text-sm">
              <option value="all">Todos os Usuarios</option>
              <option value="active">Usuarios Ativos</option>
              <option value="inactive">Usuarios Inativos</option>
            </select>
          </label>
          <fieldset className="border border-amf-border p-4 rounded-lg flex flex-col gap-2">
            <legend className="text-sm font-medium px-1">Canais</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="channel_in_app" value="on" className="w-4 h-4" />
              Notificacao no App
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="channel_email" value="on" className="w-4 h-4" />
              E-mail
            </label>
          </fieldset>
          <button type="submit" className="bg-amf-teal-600 text-white px-4 py-2 rounded-lg text-sm self-start hover:bg-amf-teal-700">
            Criar Campanha
          </button>
        </form>
      </div>
    </div>
  )
}