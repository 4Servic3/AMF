'use client'

import { useRef, useState } from 'react'

interface CourseCoverUploadProps {
  courseId: string
  currentCoverUrl?: string | null
  onUploaded?: (coverUrl: string) => void
}

export default function CourseCoverUpload({
  courseId,
  currentCoverUrl,
  onUploaded,
}: CourseCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentCoverUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    setError('')

    // Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 3 MB.')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch(`/api/admin/courses/${courseId}/cover`, {
        method: 'POST',
        body: fd,
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Falha no upload.')
        setPreview(currentCoverUrl ?? null) // revert preview
        return
      }

      onUploaded?.(json.coverUrl)
    } catch {
      setError('Erro de rede. Tente novamente.')
      setPreview(currentCoverUrl ?? null)
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-amf-ink-700">Imagem de capa</span>
        <span className="text-xs text-amf-muted-600">JPG, PNG ou WebP • Máx. 3 MB</span>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Clique ou arraste para selecionar a imagem de capa"
        className={[
          'relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-amf-teal-400 focus:ring-offset-2',
          dragOver
            ? 'border-amf-teal-400 bg-amf-teal-400/5'
            : 'border-amf-border hover:border-amf-teal-400/60 hover:bg-amf-ivory-100',
          uploading ? 'pointer-events-none opacity-60' : '',
        ].join(' ')}
        style={{ minHeight: 180 }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {preview ? (
          /* Show current/uploaded cover */
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            {/* Use regular img to avoid Next.js domain configuration issues */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Capa do curso"
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center">
              <span className="text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity px-3 py-1.5 bg-black/60 rounded-lg">
                Trocar imagem
              </span>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amf-ivory-100 border border-amf-border flex items-center justify-center">
              <svg className="w-6 h-6 text-amf-muted-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amf-ink-700">
                {uploading ? 'Enviando…' : 'Clique ou arraste a imagem aqui'}
              </p>
              <p className="text-xs text-amf-muted-600 mt-0.5">
                Recomendado: 1280 × 720 px (16:9)
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-amf-ink-700">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Enviando imagem…
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-amf-error bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Change button (shown when has cover) */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-amf-muted-600 hover:text-amf-ink-700 underline underline-offset-2 transition-colors"
        >
          Trocar imagem de capa
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onInputChange}
        aria-hidden="true"
      />
    </div>
  )
}
