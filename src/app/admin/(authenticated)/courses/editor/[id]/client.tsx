'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import LessonVideoManager, { type LessonVideoData } from '@/components/admin/courses/LessonVideoManager'
import CourseCoverUpload from '@/components/admin/courses/CourseCoverUpload'
import CoursePublicationPanel, { type CourseSchedule } from '@/components/admin/courses/CoursePublicationPanel'
import CourseAdminAccessPanel from '@/components/admin/courses/CourseAdminAccessPanel'
import { saveCourse, saveModule, saveLesson } from '@/app/admin/actions/courses'

// ─── Types ────────────────────────────────────────────────────────────────────
type Lesson = {
  id: string
  title: string
  status: string
  type: string
  video_assets: LessonVideoData | null
}
type Module = {
  id: string
  title: string
  status: string
  lessons: Lesson[]
}
type Course = {
  title: string
  description: string | null
  short_description: string | null
  slug: string
  status: string
  version: number
  workload: number | null
  course_modules: Module[]
}

// ─── Shared style tokens ──────────────────────────────────────────────────────
const field =
  'w-full rounded-lg border border-amf-border px-3 py-2 bg-white text-amf-ink-900 placeholder:text-amf-muted-600 focus:outline-none focus:ring-2 focus:ring-amf-teal-400 focus:border-transparent transition-shadow text-sm'
const btnSecondary =
  'rounded-lg border border-amf-border px-4 py-2 text-sm font-medium text-amf-ink-700 bg-white hover:bg-amf-ivory-100 disabled:opacity-50 transition-colors'

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  id: string
  initialData: Course | null
  initialCoverUrl: string | null
  initialAccessList: any[]
  initialSchedule: CourseSchedule
}

export default function CourseEditorClient({ id, initialData, initialCoverUrl, initialAccessList, initialSchedule }: Props) {
  const router = useRouter()
  const isNew = id === 'new'

  const [form, setForm] = useState(
    initialData
      ? {
          title: initialData.title,
          description: initialData.description ?? '',
          short_description: initialData.short_description ?? '',
          slug: initialData.slug,
          workload: initialData.workload ?? '',
        }
      : { title: '', description: '', short_description: '', slug: '', workload: '' }
  )
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl)
  const [slugEdited, setSlugEdited] = useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isPublished = initialData?.status === 'published'
  const isArchived = initialData?.status === 'archived'

  const statusVariant: 'success' | 'neutral' | 'warning' =
    isPublished ? 'success' : isArchived ? 'neutral' : 'warning'
  const statusLabel = isPublished ? 'Publicado' : isArchived ? 'Arquivado' : 'Rascunho'

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 6000)
  }

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setMessage(null)
    try {
      await work()
      router.refresh()
      showMsg('success', 'Alterações salvas com sucesso.')
    } catch (err: any) {
      showMsg('error', err?.message ?? 'Não foi possível salvar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  // Auto-generate slug from title when creating new course
  const handleTitleChange = (value: string) => {
    const newForm: typeof form = { ...form, title: value }
    if (isNew && !slugEdited) {
      newForm.slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    }
    setForm(newForm)
  }

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/courses"
            className="text-amf-muted-600 hover:text-amf-ink-700 transition-colors text-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Cursos
          </Link>
          <span className="text-amf-muted-600 text-sm">/</span>
          <span className="text-amf-ink-700 text-sm font-medium truncate max-w-xs">
            {isNew ? 'Novo curso' : initialData?.title}
          </span>
          {!isNew && (
            <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
          )}
        </div>
        {!isNew && (
          <Link
            href={`/admin/courses/preview/${id}`}
            target="_blank"
            className="shrink-0 text-sm text-amf-muted-600 hover:text-amf-teal-400 underline underline-offset-2 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver como aluno
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {/* ── Global Feedback Message ──────────────────────────── */}
        {message && (
          <div
            role="alert"
            className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        {/* ── Section 1: Informações básicas ──────────────────── */}
        <section className="rounded-xl border border-amf-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-amf-border bg-amf-ivory-50">
            <h2 className="font-semibold text-amf-ink-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-amf-petrol-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Informações do curso
            </h2>
          </div>
          <form
            className="p-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              run(async () => {
                const result = await saveCourse(id, form)
                if (isNew) router.replace('/admin/courses/editor/' + result.id)
              })
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-amf-ink-700 mb-1.5">
                  Título <span className="text-amf-error">*</span>
                </label>
                <input
                  className={field}
                  required
                  maxLength={200}
                  placeholder="Ex: Imersão Clínica Felina"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              {/* Slug */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-amf-ink-700 mb-1.5">
                  Endereço (slug) <span className="text-amf-error">*</span>
                </label>
                <div className="flex items-center rounded-lg border border-amf-border overflow-hidden focus-within:ring-2 focus-within:ring-amf-teal-400">
                  <span className="px-3 py-2 bg-amf-ivory-100 text-amf-muted-600 text-sm border-r border-amf-border shrink-0">
                    /cursos/
                  </span>
                  <input
                    className="flex-1 px-3 py-2 bg-white text-amf-ink-900 text-sm focus:outline-none"
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    placeholder="nome-do-curso"
                    value={form.slug}
                    onChange={(e) => { setSlugEdited(true); setForm({ ...form, slug: e.target.value }) }}
                  />
                </div>
                <p className="text-xs text-amf-muted-600 mt-1">Apenas letras minúsculas, números e hífens.</p>
              </div>

              {/* Short description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-amf-ink-700 mb-1.5">
                  Descrição curta
                </label>
                <input
                  className={field}
                  maxLength={500}
                  placeholder="Resumo exibido no card do curso (máx. 500 caracteres)"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                />
              </div>

              {/* Full description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-amf-ink-700 mb-1.5">
                  Descrição completa
                </label>
                <textarea
                  className={`${field} min-h-[100px] resize-y`}
                  maxLength={20000}
                  placeholder="Descrição detalhada do curso, objetivos, para quem é recomendado…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Workload */}
              <div>
                <label className="block text-sm font-medium text-amf-ink-700 mb-1.5">
                  Carga horária (minutos)
                </label>
                <input
                  type="number"
                  className={field}
                  min={0}
                  max={99999}
                  placeholder="Ex: 120"
                  value={form.workload}
                  onChange={(e) => setForm({ ...form, workload: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-amf-petrol-900 hover:bg-amf-petrol-700 text-white px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {busy ? 'Salvando…' : isNew ? 'Criar curso' : 'Salvar informações'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Section 2: Imagem de capa ────────────────────────── */}
        {!isNew && (
          <section className="rounded-xl border border-amf-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-amf-border bg-amf-ivory-50">
              <h2 className="font-semibold text-amf-ink-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-amf-petrol-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Imagem de capa
              </h2>
            </div>
            <div className="p-6">
              <CourseCoverUpload
                courseId={id}
                currentCoverUrl={coverUrl}
                onUploaded={(url) => {
                  setCoverUrl(url)
                  showMsg('success', 'Capa atualizada com sucesso.')
                }}
              />
            </div>
          </section>
        )}

        {/* ── New course prompt ────────────────────────────────── */}
        {isNew && (
          <div className="rounded-xl border border-amf-border bg-amf-ivory-50 px-6 py-8 text-center text-amf-muted-600 text-sm">
            Crie o curso primeiro para poder adicionar módulos, aulas e imagem de capa.
          </div>
        )}

        {/* ── Section 3: Módulos e aulas ───────────────────────── */}
        {!isNew && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-amf-ink-900">Módulos e aulas</h2>
            </div>

            {/* Add module form */}
            <form
              className="flex gap-3 mb-6"
              onSubmit={(e) => {
                e.preventDefault()
                const el = e.currentTarget
                const title = new FormData(el).get('title')
                run(async () => {
                  await saveModule(null, { course_id: id, title, status: 'draft' })
                  el.reset()
                })
              }}
            >
              <input
                className={field}
                name="title"
                required
                maxLength={200}
                aria-label="Título do novo módulo"
                placeholder="Título do novo módulo…"
              />
              <button className={btnSecondary} disabled={busy}>
                + Adicionar módulo
              </button>
            </form>

            {/* Modules list */}
            <div className="space-y-4">
              {initialData?.course_modules.map((mod, index) => (
                <div key={mod.id} className="rounded-xl border border-amf-border bg-white overflow-hidden">
                  {/* Module header */}
                  <div className="px-5 py-4 bg-amf-ivory-50 border-b border-amf-border">
                    <form
                      className="flex flex-wrap items-end gap-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const data = new FormData(e.currentTarget)
                        run(async () => {
                          await saveModule(mod.id, { title: data.get('title'), status: data.get('status') })
                        })
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-semibold text-amf-muted-600 mb-1 uppercase tracking-wider">
                          Módulo {index + 1}
                        </label>
                        <input
                          name="title"
                          className={field}
                          defaultValue={mod.title}
                          required
                          placeholder="Título do módulo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-amf-muted-600 mb-1 uppercase tracking-wider">
                          Status
                        </label>
                        <select name="status" className={field} defaultValue={mod.status}>
                          <option value="draft">Rascunho</option>
                          <option value="published">Publicado</option>
                          <option value="archived">Arquivado</option>
                        </select>
                      </div>
                      <button className={btnSecondary} disabled={busy}>
                        Salvar módulo
                      </button>
                    </form>
                  </div>

                  {/* Lessons list */}
                  <div className="divide-y divide-amf-border">
                    {mod.lessons.map((lesson) => (
                      <div key={lesson.id} className="px-5 py-4 space-y-3">
                        <form
                          className="flex flex-wrap items-end gap-3"
                          onSubmit={(e) => {
                            e.preventDefault()
                            const data = new FormData(e.currentTarget)
                            run(async () => {
                              await saveLesson(lesson.id, {
                                title: data.get('title'),
                                status: data.get('status'),
                              })
                            })
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-semibold text-amf-muted-600 mb-1 uppercase tracking-wider">
                              Aula
                            </label>
                            <input
                              className={field}
                              name="title"
                              defaultValue={lesson.title}
                              required
                              placeholder="Título da aula"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-amf-muted-600 mb-1 uppercase tracking-wider">
                              Status
                            </label>
                            <select
                              key={lesson.status}
                              className={field}
                              name="status"
                              defaultValue={lesson.status}
                            >
                              <option value="draft">Rascunho</option>
                              <option value="published">Publicada</option>
                              <option value="archived">Arquivada</option>
                            </select>
                          </div>
                          <button className={btnSecondary} disabled={busy}>
                            Salvar
                          </button>
                          {lesson.type === 'video' && (
                            <button
                              type="button"
                              className={btnSecondary}
                              onClick={() =>
                                setActiveVideo(activeVideo === lesson.id ? null : lesson.id)
                              }
                            >
                              {activeVideo === lesson.id ? 'Fechar vídeo' : 'Gerenciar vídeo'}
                            </button>
                          )}
                        </form>

                        {/* Video manager */}
                        {activeVideo === lesson.id && (
                          <LessonVideoManager
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                            initialVideo={lesson.video_assets}
                            onVideoUpdated={() => router.refresh()}
                          />
                        )}
                      </div>
                    ))}

                    {/* Add lesson form */}
                    <div className="px-5 py-4 bg-amf-ivory-50/50">
                      <form
                        className="flex gap-3"
                        onSubmit={(e) => {
                          e.preventDefault()
                          const el = e.currentTarget
                          const title = new FormData(el).get('title')
                          run(async () => {
                            const result = await saveLesson(null, {
                              module_id: mod.id,
                              title,
                              status: 'draft',
                            })
                            el.reset()
                            setActiveVideo(result.id)
                          })
                        }}
                      >
                        <input
                          className={field}
                          name="title"
                          required
                          maxLength={200}
                          aria-label={`Nova aula em ${mod.title}`}
                          placeholder="Título da nova aula de vídeo…"
                        />
                        <button className={btnSecondary} disabled={busy}>
                          + Aula
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}

              {initialData?.course_modules.length === 0 && (
                <div className="rounded-xl border border-dashed border-amf-border px-6 py-10 text-center text-amf-muted-600 text-sm">
                  Nenhum módulo ainda. Adicione o primeiro módulo acima.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Section 4: Gestão de acesso ─────────────────────── */}
        {!isNew && (
          <details className="rounded-xl border border-amf-border bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium">Acesso dos alunos (opcional)</summary>
          <CourseAdminAccessPanel
            courseId={id}
            courseTitle={initialData?.title ?? ''}
            initialEntitlements={initialAccessList}
          />
          </details>
        )}
      </div>

      {!isNew && <div className="mt-6"><CoursePublicationPanel courseId={id} version={initialData!.version} status={initialData!.status} slug={form.slug} schedule={initialSchedule} saveInformation={() => saveCourse(id, form)} /></div>}
    </div>
  )
}
