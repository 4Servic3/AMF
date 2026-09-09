import React from 'react'
import Link from 'next/link'

/**
 * Admin-specific 404 page.
 * This catches notFound() calls from any route inside /admin/(authenticated)/
 * and keeps the user inside the admin shell — NEVER redirects to /app.
 */
export default function AdminNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-amf-ivory-100 border border-amf-border flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-amf-muted-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-5xl font-bold font-editorial text-amf-ink-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-amf-ink-900 mb-3">Página não encontrada</h2>
        <p className="text-amf-muted-600 mb-8">
          O recurso que você está tentando acessar não existe, foi removido ou você não tem permissão para visualizá-lo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amf-petrol-900 hover:bg-amf-petrol-700 text-white px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Painel Admin
          </Link>
          <Link
            href="/admin/courses"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amf-border bg-white hover:bg-amf-ivory-100 text-amf-ink-700 px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Ver Cursos
          </Link>
        </div>
      </div>
    </div>
  )
}
