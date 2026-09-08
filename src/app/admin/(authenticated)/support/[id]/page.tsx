import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { replyToTicket } from '../../../actions/support'
import PageHeader from '@/components/admin/ui/PageHeader'

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAal2()
  await requirePermission('support.manage')
  const { id } = await params
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*, support_messages(*)')
    .eq('id', id)
    .single()

  if (!ticket) notFound()
  const messages = (ticket.support_messages as any[]) || []

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title={`Ticket #${id.slice(0, 8)}`} description={ticket.subject} />
      <div className="flex flex-col gap-4">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`p-4 rounded-xl border ${msg.is_internal ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-amf-border'}`}>
            <div className="font-semibold text-sm mb-1">{msg.author_id}</div>
            <p>{msg.content}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-amf-ink-400 text-sm">Sem mensagens ainda.</p>}
      </div>
      <div className="bg-white p-6 rounded-xl border border-amf-border">
        <h2 className="text-lg font-semibold mb-4">Responder</h2>
        <form action={async (formData) => {
          'use server'
          const content = formData.get('content') as string
          const isInternal = formData.get('isInternal') === 'on'
          await replyToTicket(id, content, isInternal)
        }} className="flex flex-col gap-4">
          <textarea name="content" required rows={4} className="border border-amf-border p-2 rounded-lg w-full" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isInternal" />
            <span className="text-sm font-medium">Nota Interna</span>
          </label>
          <button type="submit" className="bg-amf-teal-600 text-white px-4 py-2 rounded-lg self-start text-sm">Enviar</button>
        </form>
      </div>
    </div>
  )
}