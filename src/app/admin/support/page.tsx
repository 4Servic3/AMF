import Link from 'next/link'

export default function SupportPage() {
  const mockTickets = [
    { id: '1', subject: 'Cannot access my course', status: 'Open' },
    { id: '2', subject: 'Billing issue', status: 'Pending' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Subject</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockTickets.map(ticket => (
              <tr key={ticket.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">#{ticket.id}</td>
                <td className="p-4">{ticket.subject}</td>
                <td className="p-4">{ticket.status}</td>
                <td className="p-4">
                  <Link href={`/admin/support/${ticket.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
