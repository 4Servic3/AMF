'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { publishCourse, scheduleCourse } from '@/app/admin/actions/courses'

export type CourseSchedule = { status: string; publish_at: string; last_error: string | null } | null

export default function CoursePublicationPanel({ courseId, version, status, slug, schedule, saveInformation }: {
  courseId: string; version: number; status: string; slug: string; schedule: CourseSchedule;
  saveInformation: () => Promise<unknown>;
}) {
  const router = useRouter()
  const [mode, setMode] = useState('now')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const published = status === 'published'
  const pending = schedule?.status === 'scheduled'
  async function submit(cancel = false) {
    setBusy(true); setMessage('')
    try {
      let when: string | null = null
      if (!cancel && mode === 'later') {
        const parsed = new Date(date + ':00-03:00')
        if (!date || !Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) {
          setMessage('Escolha uma data e um horário futuros, no horário de Brasília.'); return
        }
        when = parsed.toISOString()
      }
      if (!cancel) await saveInformation()
      const result = cancel || mode === 'later'
        ? await scheduleCourse(courseId, version, when)
        : await publishCourse(courseId, version)
      if (!result.success) { setMessage(result.error || 'Não foi possível concluir.'); return }
      setMessage(cancel ? 'Agendamento cancelado. O curso continua em rascunho.' : mode === 'later' ? 'Publicação agendada.' : 'Curso e aulas publicados com sucesso.')
      router.refresh()
    } catch { setMessage('Não foi possível salvar. Confira os dados do curso e tente novamente.') }
    finally { setBusy(false) }
  }
  return <section className="rounded-xl border border-amf-border bg-white p-6 space-y-4" aria-label="Publicação do curso">
    <h2 className="font-semibold text-amf-ink-900">3. Publicar</h2>
    <p className="text-sm text-amf-muted-600">{published
      ? 'O curso já está no catálogo. Você pode trocar a capa e editar as informações. Use Salvar e publicar para liberar as aulas adicionadas.'
      : 'Ao publicar, o curso aparece no catálogo e suas aulas ficam disponíveis para os alunos com acesso. Todos os vídeos precisam estar prontos e vinculados.'}</p>
    <p className="text-xs text-amf-muted-600">Esta ação salva as informações acima e publica os módulos e aulas salvos, exceto os arquivados.</p>
    {pending && <div role="status" className="rounded-lg bg-amber-50 p-3 text-sm">Agendado para {new Date(schedule.publish_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} — Brasília.
      <button type="button" disabled={busy} className="ml-3 underline" onClick={() => submit(true)}>Cancelar agendamento</button>
    </div>}
    {schedule?.status === 'failed' && <p role="alert" className="text-sm text-red-700">O agendamento não foi publicado: {schedule.last_error}. Corrija as aulas e agende novamente.</p>}
    {!published && <div className="flex flex-wrap gap-4 text-sm">
      <label><input type="radio" name="publicationMode" checked={mode === 'now'} onChange={() => setMode('now')} /> Publicar agora</label>
      <label><input type="radio" name="publicationMode" checked={mode === 'later'} onChange={() => setMode('later')} /> Agendar</label>
    </div>}
    {!published && mode === 'later' && <label className="block text-sm">Data e horário de Brasília
      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="block border rounded-lg p-2 mt-1" />
      <span className="block text-xs mt-1 text-amf-muted-600">A publicação automática ocorre em até um minuto após o horário escolhido.</span>
    </label>}
    {message && <p role="status" className="text-sm rounded-lg bg-amf-ivory-100 p-3">{message}</p>}
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" disabled={busy || status === 'archived'} onClick={() => submit()} className="rounded-lg bg-amf-petrol-900 text-white px-5 py-3 text-sm font-semibold disabled:opacity-50">
        {busy ? 'Salvando…' : published ? 'Salvar e publicar alterações' : mode === 'later' ? 'Agendar publicação' : 'Salvar e publicar curso'}
      </button>
      {published && <Link className="text-sm underline" href={'/app/cursos/' + slug} target="_blank">Ver curso na plataforma</Link>}
    </div>
  </section>
}
