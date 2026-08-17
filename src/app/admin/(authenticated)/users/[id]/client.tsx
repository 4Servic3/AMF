'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  grantManualAccess,
  revokeAccess,
  suspendUser,
  addInternalNote,
  handleDataRequest,
} from '../../../actions/users'

export default function UserCrmClient({ user, entitlements, notes }: { user: any, entitlements: any[], notes: any[] }) {
  const [activeTab, setActiveTab] = useState('visao-geral')
  const [noteText, setNoteText] = useState('')
  const [productId, setProductId] = useState('')
  const [reason, setReason] = useState('')
  const router = useRouter()

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'acessos', label: 'Acessos' },
    { id: 'aprendizado', label: 'Aprendizado' },
    { id: 'suporte', label: 'Suporte' },
    { id: 'privacidade', label: 'Privacidade' },
  ]

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim()) return
    await addInternalNote(user.id, noteText)
    setNoteText('')
  }

  async function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !reason) return
    await grantManualAccess(user.id, productId, reason)
    setProductId('')
    setReason('')
  }

  async function handleRevoke(prodId: string) {
    if (!confirm('Revogar acesso?')) return
    await revokeAccess(user.id, prodId, 'Revogado pelo suporte')
  }

  async function handleSuspend() {
    if (!confirm('Suspender usuário?')) return
    await suspendUser(user.id, 'Suspensão manual')
  }

  async function handleData(actionType: 'export' | 'anonymize') {
    if (actionType === 'anonymize' && !confirm('Tem certeza? A anonimização é irreversível.')) return
    await handleDataRequest(user.id, actionType)
    if (actionType === 'anonymize') {
      router.push('/admin/users')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h1>
        <p className="text-gray-500">{user?.email}</p>
        <div className="mt-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${user?.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {user?.status === 'suspended' ? 'Suspenso' : 'Ativo'}
          </span>
          <button onClick={handleSuspend} className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100">
            Suspender Conta
          </button>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex border-b px-6 pt-4 gap-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'visao-geral' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Detalhes do Usuário</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Criado em</p>
                <p>{new Date(user?.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>{user?.status}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'acessos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Entitlements (Acessos)</h2>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concedido Por</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entitlements.map((e) => (
                    <tr key={e.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{e.product?.name || e.product_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${e.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.granted_by}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(e.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {e.status === 'active' && (
                          <button onClick={() => handleRevoke(e.product_id)} className="text-red-600 hover:text-red-900">Revogar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {entitlements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum acesso encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleGrantAccess} className="bg-gray-50 p-4 rounded-lg border flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Produto</label>
                <input required type="text" value={productId} onChange={e => setProductId(e.target.value)} className="w-full border p-2 rounded" placeholder="Ex: prod_123" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input required type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full border p-2 rounded" placeholder="Motivo da concessão" />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Conceder Acesso</button>
            </form>
          </div>
        )}

        {activeTab === 'aprendizado' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Progresso de Aprendizado</h2>
            <p className="text-gray-500">Nenhum dado de progresso disponível no momento.</p>
          </div>
        )}

        {activeTab === 'suporte' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Notas Internas de Suporte</h2>
            
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full border rounded-lg p-3 min-h-[100px]"
                placeholder="Adicione uma nota sobre o atendimento a este usuário..."
                required
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Salvar Nota
              </button>
            </form>

            <div className="space-y-4 mt-6">
              {notes.map((n) => (
                <div key={n.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-gray-700">
                      Adicionado por: Admin ID {n.admin_id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{n.note}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-gray-500">Nenhuma nota interna registrada.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'privacidade' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-red-600">Requisições de Privacidade de Dados</h2>
            <p className="text-sm text-gray-600">
              Ações relacionadas à LGPD/GDPR. Estas ações são auditadas e irreversíveis em alguns casos.
            </p>
            <div className="flex gap-4">
              <button onClick={() => handleData('export')} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                Exportar Dados do Usuário
              </button>
              <button onClick={() => handleData('anonymize')} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100">
                Anonimizar Usuário (Soft Delete)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
