'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { startCaseStory, finishCaseStory, archiveCaseStory } from '@/app/admin/actions/case-stories'
import { createClient } from '@/lib/supabase/client'
import type { CaseOption, CaseStoryRow } from '@/lib/case-stories'

export default function CaseStoryStudio({ cases, stories, selectedCase = '' }: { cases: CaseOption[]; stories: CaseStoryRow[]; selectedCase?: string }) {
  const router = useRouter()
  const [caseId, setCaseId] = useState(selectedCase)
  const [caseTitle, setCaseTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [recording, setRecording] = useState(false)
  const [opening, setOpening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)
  const pendingIds = stories.filter(s => s.status === 'processing').slice(0,5).map(s => s.id).join(',')
  useEffect(() => {
    if (!pendingIds) return
    let active = true, running = false
    const poll = async () => {
      if (running || document.hidden) return
      running = true
      try {
        const results = await Promise.all(pendingIds.split(',').map(finishCaseStory))
        if (active && results.some(r => r.status === 'published' || r.status === 'error')) router.refresh()
      } catch { /* A later poll or manual check retries. */ }
      finally { running = false }
    }
    const interval = setInterval(poll,15000)
    return () => {active=false;clearInterval(interval)}
  },[pendingIds,router])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stream.current?.getTracks().forEach(track => track.stop())
    }
  }, [])
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  useEffect(() => {
    if (!busy && !recording) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload',warn)
    return () => window.removeEventListener('beforeunload',warn)
  }, [busy,recording])

  function selectFile(next: File | undefined) {
    if (!next) return
    const image = ['image/jpeg','image/png','image/webp'].includes(next.type)
    if ((!image && !next.type.startsWith('video/')) || next.size > (image ? 10*1024**2 : 1024**3) || !next.size) { setMessage('Escolha um vídeo de até 1 GB ou imagem JPG, PNG ou WebP de até 10 MB.'); return }
    setFile(next); setMessage('')
  }
  async function record() {
    if (opening || recording) return
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setMessage('Este navegador não oferece gravação. Use Enviar vídeo para escolher um arquivo ou gravar com a câmera do celular.'); return }
    setOpening(true)
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', width:{ideal:720}, height:{ideal:1280} }, audio:true })
      if (!mounted.current) { stream.current.getTracks().forEach(t => t.stop()); return }
      if (video.current) { video.current.srcObject = stream.current; await video.current.play() }
      const mimeType = ['video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(t => MediaRecorder.isTypeSupported(t))
      const chunks: Blob[] = []
      const capture = new MediaRecorder(stream.current, mimeType ? { mimeType, videoBitsPerSecond:2500000 } : undefined)
      recorder.current = capture
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      capture.onstop = () => {
        if (timer.current) clearTimeout(timer.current)
        stream.current?.getTracks().forEach(track => track.stop())
        if (video.current) video.current.srcObject = null
        if (!mounted.current) return
        setRecording(false)
        const type = capture.mimeType || chunks[0]?.type || 'video/webm'
        const recorded = new File(chunks,`story-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`,{type})
        selectFile(recorded)
      }
      capture.onerror = () => { setMessage('A gravação foi interrompida. Confira o vídeo antes de publicar.'); if (capture.state === 'recording') capture.stop() }
      capture.start(1000)
      setFile(null); setRecording(true)
      timer.current = setTimeout(() => { if (capture.state === 'recording') capture.stop() }, 5 * 60 * 1000)
    } catch {
      stream.current?.getTracks().forEach(track => track.stop())
      setMessage('Não foi possível abrir câmera e microfone. Autorize o acesso no navegador ou envie um vídeo já gravado.')
    } finally { setOpening(false) }
  }
  async function check(id: string) {
    setBusy(true)
    try {
      const result = await finishCaseStory(id)
      setMessage(result.error || (result.status === 'published' ? 'Story publicado na área dos membros.' : result.status === 'error' ? 'O vídeo não pôde ser processado. Envie outro arquivo.' : 'Vídeo em processamento. A publicação acontece automaticamente quando estiver pronto.'))
      router.refresh()
    } catch { setMessage('Não foi possível verificar. Tente novamente.') }
    finally { setBusy(false) }
  }
  async function remove(id:string) {
    setBusy(true)
    try { const result = await archiveCaseStory(id); setMessage(result.error || 'Story removido da área dos membros.'); router.refresh() }
    catch { setMessage('Não foi possível remover o story.') }
    finally {setBusy(false)}
  }
  async function publish() {
    if (!file || busy || opening || recording) return
    setBusy(true); setMessage('Preparando envio…'); setProgress(0)
    try {
      const result = await startCaseStory({caseId:caseId || null,caseTitle,caption,fileName:file.name,fileType:file.type,fileSize:file.size})
      if (result.error || !result.id) throw new Error(result.error || 'Não foi possível iniciar.')
      if (result.path && result.token) {
        const uploaded = await createClient().storage.from('case-story-images').uploadToSignedUrl(result.path,result.token,file,{contentType:file.type})
        if (uploaded.error) throw new Error('Não foi possível enviar a imagem. Tente novamente.')
      } else {
        const { createUpload } = await import('@mux/upchunk')
        await new Promise<void>((resolve,reject) => {
        const upload = createUpload({ endpoint:result.uploadUrl!, file, chunkSize:5120 })
        upload.on('progress',event => { setProgress(Math.round(event.detail)); setMessage('Enviando vídeo…') })
        upload.on('success',() => resolve())
        upload.on('error',() => reject(new Error('Falha no envio. Verifique a conexão e tente novamente.')))
        })
      }
      setFile(null); setCaption(''); setCaseTitle(''); setCaseId(result.caseId || '')
      const status = await finishCaseStory(result.id)
      setMessage(status.error || (status.status === 'published' ? 'Story publicado na área dos membros.' : 'Envio concluído. Processando e publicando automaticamente; você já pode enviar outro story.'))
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível enviar o vídeo.') }
    finally { setBusy(false) }
  }
  return <section className="space-y-5 rounded-2xl border border-amf-border bg-white p-5">
    <div><h2 className="text-xl font-semibold">Publicar story de um caso</h2><p className="text-sm text-amf-muted">Grave ou envie um vídeo ou imagem, confira e escolha o caso. O story ficará disponível aos membros após o processamento.</p></div>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy || opening} onClick={() => recording ? (recorder.current?.state === 'recording' && recorder.current.stop()) : void record()} className="rounded-full bg-amf-teal-600 px-5 py-2 text-white disabled:opacity-50">{opening ? 'Abrindo câmera…' : recording ? 'Parar gravação' : 'Gravar com câmera'}</button>
      <label className="rounded-full border px-5 py-2">Enviar vídeo ou imagem<input aria-label="Enviar vídeo ou imagem" type="file" accept="video/*,image/jpeg,image/png,image/webp" disabled={busy || recording || opening} onChange={event => { selectFile(event.target.files?.[0]); event.target.value='' }} className="block max-w-full text-sm" /></label>
    </div>
    <video ref={video} muted playsInline className={recording ? 'mx-auto max-h-96 rounded-xl bg-black' : 'hidden'} />
    {recording && <p role="status">Gravando — limite de 5 minutos por gravação.</p>}
    {preview && (file?.type.startsWith('image/') ? <img src={preview} alt="Prévia do story" className="mx-auto max-h-96 max-w-full rounded-xl" /> : <video src={preview} controls playsInline preload="metadata" className="mx-auto max-h-96 max-w-full rounded-xl bg-black" />)}
    <label className="block">Caso<select value={caseId} onChange={event => setCaseId(event.target.value)} disabled={busy} className="mt-1 block w-full rounded-xl border p-3"><option value="">Criar novo caso</option>{cases.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    {!caseId && <label className="block">Nome do novo caso<input value={caseTitle} maxLength={160} disabled={busy} onChange={event => setCaseTitle(event.target.value)} className="mt-1 block w-full rounded-xl border p-3" /></label>}
    <label className="block">Título ou legenda do story<textarea value={caption} maxLength={500} disabled={busy} onChange={event => setCaption(event.target.value)} className="mt-1 block w-full rounded-xl border p-3" /></label>
    <button type="button" disabled={busy || opening || recording || !file || (!caseId && !caseTitle.trim())} onClick={publish} className="rounded-full bg-amf-teal-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? `Aguarde… ${progress}%` : 'Publicar story'}</button>
    {message && <p role="status" className="text-sm">{message}</p>}
    <div className="border-t pt-4"><h3 className="font-semibold">Stories enviados</h3>{stories.length === 0 && <p className="text-sm text-amf-muted">Nenhum vídeo enviado ainda.</p>}{stories.map(story => <div key={story.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-3"><span>{cases.find(c => c.id === story.case_id)?.title || 'Caso'}{story.caption ? ` — ${story.caption}` : ''}<small className="block">{story.status === 'published' ? 'Publicado' : story.status === 'error' ? 'Falha no processamento — envie outro vídeo' : 'Processando'}</small></span>{story.status === 'processing' && <button type="button" disabled={busy} onClick={() => check(story.id)} className="rounded-full border px-3 py-2 text-sm">Verificar publicação</button>}<button type="button" disabled={busy} onClick={() => remove(story.id)} className="rounded-full border px-3 py-2 text-sm">Remover story</button></div>)}</div>
  </section>
}
