'use client'

import { useState, useTransition } from 'react'
import { grantCourseAccess, revokeCourseAccess } from '@/app/admin/actions/courses'

interface Entitlement {
  id: string
  profile_id: string
  status: string
  starts_at: string
  expires_at: string | null
  users: { first_name: string | null; last_name: string | null; email: string } | null
}

interface CourseAdminAccessPanelProps {
  courseId: string
  courseTitle: string
  initialEntitlements: Entitlement[]
}

export default function CourseAdminAccessPanel({
  courseId,
  courseTitle,
  initialEntitlements,
}: CourseAdminAccessPanelProps) {
  const [entitlements, setEntitlements] = useState(initialEntitlements)
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleGrant = () => {
    if (!email.trim()) return
    startTransition(async () => {
      try {
        const result = await grantCourseAccess(courseId, email.trim(), expiresAt || null)
        setEntitlements((prev) => [result as unknown as Entitlement, ...prev])
        setEmail('')
        setExpiresAt('')
        showMessage('success', `Acesso concedido para ${email.trim()}.`)
      } catch (err: any) {
        showMessage('error', err.message ?? 'Não foi possível conceder acesso.')
      }
    })
  }

  const handleRevoke = (entitlementId: string, userEmail: string) => {
    startTransition(async () => {
      try {
        await revokeCourseAccess(entitlementId)
        setEntitlements((prev) =>
          prev.map((e) => (e.id === entitlementId ? { ...e, status: 'revoked' } : e))
        )
        showMessage('success', `Acesso de ${userEmail} revogado.`)
      } catch (err: any) {
        showMessage('error', err.message ?? 'Não foi possível revogar acesso.')
      }
    })
  }

  const active = entitlements.filter((e) => e.status === 'active')
  const revoked = entitlements.filter((e) => e.status !== 'active')

  return (
    <section className="rounded-xl border border-amf-border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amf-border bg-amf-ivory-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amf-teal-400/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-amf-petrol-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amf-ink-900">Acesso ao curso</h3>
            <p className="text-xs text-amf-muted-600">
              {active.length} {active.length === 1 ? 'usuário com' : 'usuários com'} acesso ativo
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Grant Access Form */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-amf-ink-700">Conceder acesso por e-mail</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="flex-1 rounded-lg border border-amf-border px-3 py-2 text-sm bg-white placeholder:text-amf-muted-600 focus:outline-none focus:ring-2 focus:ring-amf-teal-400 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleGrant()}
              disabled={isPending}
            />
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              title="Data de expiração (opcional)"
              className="w-full sm:w-44 rounded-lg border border-amf-border px-3 py-2 text-sm bg-white text-amf-ink-700 focus:outline-none focus:ring-2 focus:ring-amf-teal-400 focus:border-transparent"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={handleGrant}
              disabled={isPending || !email.trim()}
              className="whitespace-nowrap rounded-lg bg-amf-petrol-900 hover:bg-amf-petrol-700 text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Aguarde…' : 'Conceder acesso'}
            </button>
          </div>
          <p className="text-xs text-amf-muted-600">
            Data de expiração opcional. Se não informada, o acesso é vitalício.
          </p>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            role="alert"
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Active entitlements */}
        {active.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amf-muted-600 uppercase tracking-wider">Acessos ativos</p>
            <div className="rounded-lg border border-amf-border overflow-hidden">
              {active.map((e, idx) => {
                const name = [e.users?.first_name, e.users?.last_name].filter(Boolean).join(' ') || '—'
                const userEmail = e.users?.email ?? '—'
                return (
                  <div
                    key={e.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 ${
                      idx > 0 ? 'border-t border-amf-border' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-amf-ink-900 truncate">{name}</p>
                      <p className="text-xs text-amf-muted-600 truncate">{userEmail}</p>
                      {e.expires_at && (
                        <p className="text-xs text-amf-warning mt-0.5">
                          Expira em {new Date(e.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevoke(e.id, userEmail)}
                      disabled={isPending}
                      className="shrink-0 text-xs text-amf-error hover:underline disabled:opacity-50 transition-colors"
                    >
                      Revogar acesso
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Revoked entitlements (collapsible summary) */}
        {revoked.length > 0 && (
          <details className="group">
            <summary className="text-xs text-amf-muted-600 cursor-pointer hover:text-amf-ink-700 transition-colors list-none flex items-center gap-1">
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 4l4 4-4 4V4z" />
              </svg>
              {revoked.length} acesso{revoked.length !== 1 ? 's' : ''} revogado{revoked.length !== 1 ? 's' : ''}
            </summary>
            <div className="mt-2 rounded-lg border border-amf-border overflow-hidden">
              {revoked.map((e, idx) => {
                const userEmail = e.users?.email ?? '—'
                return (
                  <div
                    key={e.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${idx > 0 ? 'border-t border-amf-border' : ''}`}
                  >
                    <span className="text-sm text-amf-muted-600 line-through truncate">{userEmail}</span>
                    <span className="ml-auto shrink-0 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      Revogado
                    </span>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        {active.length === 0 && revoked.length === 0 && (
          <p className="text-sm text-amf-muted-600 text-center py-4">
            Nenhum acesso concedido ainda.
          </p>
        )}
      </div>
    </section>
  )
}
