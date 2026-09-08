'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/admin/ui/PageHeader'
import LessonVideoManager, { type LessonVideoData } from '@/components/admin/courses/LessonVideoManager'
import { saveCourse, saveModule, saveLesson, publishCourse } from '@/app/admin/actions/courses'

type Lesson = { id: string; title: string; status: string; type: string; video_assets: LessonVideoData | null }
type Module = { id: string; title: string; status: string; lessons: Lesson[] }
type Course = { title: string; description: string | null; slug: string; status: string; version: number; course_modules: Module[] }
const field = 'w-full rounded-lg border border-amf-border px-3 py-2 bg-white'
const button = 'rounded-lg border border-amf-border px-4 py-2 text-sm disabled:opacity-50'

export default function CourseEditorClient({ id, initialData }: { id: string; initialData: Course | null }) {
  const router = useRouter()
  const [form, setForm] = useState(initialData || { title: '', description: '', slug: '', status: 'draft' })
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setMessage('')
    try { await work(); router.refresh(); setMessage('Alterações salvas.') }
    catch { setMessage('Não foi possível salvar. Confira os dados e, para publicar, vincule um vídeo pronto à aula.') }
    finally { setBusy(false) }
  }
  return <div className="space-y-6 max-w-5xl mx-auto pb-20">
    <PageHeader title={id === 'new' ? 'Novo curso' : `Editar: ${initialData?.title}`} description="Cadastre os módulos, envie os vídeos e publique as aulas quando estiverem prontas." />
    <p role="status" className="text-sm">{message}</p>
    <form className="rounded-xl border border-amf-border bg-white p-6 space-y-4" onSubmit={e => {
      e.preventDefault(); run(async () => {
        const result = await saveCourse(id, form)
        if (id === 'new') router.replace('/admin/courses/editor/' + result.id)
      })
    }}>
      <label className="block">Título<input className={field} required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block">Endereço do curso<input className={field} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug || ''} placeholder="nome-do-curso" onChange={e => setForm({ ...form, slug: e.target.value })} /></label>
      <label className="block">Descrição<textarea className={field} maxLength={20000} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <p className="text-sm">Situação: {initialData?.status === 'published' ? 'Publicado' : initialData?.status === 'archived' ? 'Arquivado' : 'Rascunho'}</p>
      <div className="flex gap-3">
        <button className={button} disabled={busy}>Salvar informações</button>
        {initialData && initialData.status !== 'published' && <button type="button" className={button} disabled={busy} onClick={() => run(async () => { await publishCourse(id, initialData.version) })}>Publicar curso</button>}
      </div>
    </form>
    {id === 'new' ? <p>Salve o curso para adicionar os módulos e as aulas.</p> : <>
      <h2 className="text-lg font-semibold">Módulos e aulas</h2>
      <form className="flex gap-3" onSubmit={e => {
        e.preventDefault(); const element = e.currentTarget; const title = new FormData(element).get('title')
        run(async () => { await saveModule(null, { course_id: id, title, status: 'draft' }); element.reset() })
      }}>
        <input className={field} name="title" required maxLength={200} aria-label="Título do novo módulo" placeholder="Título do novo módulo" />
        <button className={button} disabled={busy}>Adicionar módulo</button>
      </form>
      {initialData?.course_modules.map((mod, index) => <section key={mod.id} className="rounded-xl border border-amf-border bg-white p-5 space-y-4">
        <form className="flex flex-wrap items-end gap-3" onSubmit={e => {
          e.preventDefault(); const data = new FormData(e.currentTarget)
          run(async () => { await saveModule(mod.id, { title: data.get('title'), status: data.get('status') }) })
        }}>
          <label className="flex-1">Módulo {index + 1}<input name="title" className={field} defaultValue={mod.title} required /></label>
          <label>Situação<select name="status" className={field} defaultValue={mod.status}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
          <button className={button} disabled={busy}>Salvar módulo</button>
        </form>
        {mod.lessons.map(lesson => <div key={lesson.id} className="border-t pt-4 space-y-3">
          <form className="flex flex-wrap items-end gap-3" onSubmit={e => {
            e.preventDefault(); const data = new FormData(e.currentTarget)
            run(async () => { await saveLesson(lesson.id, { title: data.get('title'), status: data.get('status') }) })
          }}>
            <label className="flex-1">Aula<input className={field} name="title" defaultValue={lesson.title} required /></label>
            <label>Situação<select key={lesson.status} className={field} name="status" defaultValue={lesson.status}><option value="draft">Rascunho</option><option value="published">Publicada</option><option value="archived">Arquivada</option></select></label>
            <button className={button} disabled={busy}>Salvar aula</button>
            {lesson.type === 'video' && <button type="button" className={button} onClick={() => setActiveVideo(activeVideo === lesson.id ? null : lesson.id)}>{activeVideo === lesson.id ? 'Fechar vídeo' : 'Gerenciar vídeo'}</button>}
          </form>
          {activeVideo === lesson.id && <LessonVideoManager lessonId={lesson.id} lessonTitle={lesson.title} initialVideo={lesson.video_assets} onVideoUpdated={() => router.refresh()} />}
        </div>)}
        <form className="flex gap-3" onSubmit={e => {
          e.preventDefault(); const element = e.currentTarget; const title = new FormData(element).get('title')
          run(async () => { const result = await saveLesson(null, { module_id: mod.id, title, status: 'draft' }); element.reset(); setActiveVideo(result.id) })
        }}>
          <input className={field} name="title" required maxLength={200} aria-label={'Nova aula em ' + mod.title} placeholder="Título da nova aula de vídeo" />
          <button className={button} disabled={busy}>Adicionar aula</button>
        </form>
      </section>)}
    </>}
  </div>
}
