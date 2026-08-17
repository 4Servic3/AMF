import { replyToTicket } from '../../actions/support'

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id

  const mockMessages = [
    { id: 'm1', content: 'Hi, I need help.', isInternal: false, author: 'User' },
    { id: 'm2', content: 'Sure, we are checking this.', isInternal: false, author: 'Agent' },
    { id: 'm3', content: 'Note: user has unpaid invoice.', isInternal: true, author: 'Agent' },
  ]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Ticket #{id}</h1>
      
      <div className="flex flex-col gap-4 mb-8">
        {mockMessages.map(msg => (
          <div 
            key={msg.id} 
            className={`p-4 rounded-lg shadow-sm border ${
              msg.isInternal ? 'bg-yellow-100 border-yellow-300 text-yellow-900' : 'bg-white border-gray-200'
            }`}
          >
            <div className="font-semibold text-sm mb-1">
              {msg.author} {msg.isInternal && <span className="uppercase text-xs ml-2 bg-yellow-300 px-1 py-0.5 rounded">Internal Note</span>}
            </div>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-6 rounded shadow border">
        <h2 className="text-lg font-semibold mb-4">Reply</h2>
        <form action={async (formData) => {
          'use server'
          const content = formData.get('content') as string
          const isInternal = formData.get('isInternal') === 'on'
          await replyToTicket(id, content, isInternal)
        }} className="flex flex-col gap-4">
          <textarea 
            name="content" 
            required 
            rows={4} 
            className="border p-2 rounded w-full" 
            placeholder="Type your message..."
          ></textarea>
          
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isInternal" className="w-4 h-4" />
            <span className="font-medium text-yellow-700 bg-yellow-100 px-2 rounded">Mark as Internal Note (hidden from user)</span>
          </label>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded self-start hover:bg-blue-700">
            Send Reply
          </button>
        </form>
      </div>
    </div>
  )
}
