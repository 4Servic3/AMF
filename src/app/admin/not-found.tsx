import React from 'react'
import Link from 'next/link'

/**
 * Admin root-level 404.
 * Catches any notFound() from /admin routes not covered by the (authenticated) group.
 * Never redirects to /app.
 */
export default function AdminRootNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-amf-ivory-50">
      <div className="max-w-md">
        <h1 className="text-5xl font-bold text-amf-ink-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-amf-ink-900 mb-3">Página não encontrada</h2>
        <p className="text-amf-muted-600 mb-8">
          O recurso que você está tentando acessar não existe ou você não tem permissão para visualizá-lo.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg bg-amf-petrol-900 hover:bg-amf-petrol-700 text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          ← Voltar ao painel admin
        </Link>
      </div>
    </div>
  )
}
