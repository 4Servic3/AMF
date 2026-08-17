import { requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import DataTable from '@/components/admin/ui/DataTable'
import Link from 'next/link'

export default async function UsersPage() {
  await requirePermission('users.manage')
  const supabase = await createClient()
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    
  const columns = [
    { accessorKey: 'first_name', header: 'Nome' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'status', header: 'Status' },
    {
      header: 'Ações',
      cell: (row: any) => (
        <Link href={`/admin/users/${row.id}`} className="text-blue-500 hover:underline">
          Ver Perfil
        </Link>
      )
    }
  ]
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Usuários (CRM)</h1>
      </div>
      <DataTable columns={columns} data={users || []} />
    </div>
  )
}
