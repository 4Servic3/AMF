'use client'

import { useEffect, useRef, useState } from 'react'
import { capturePortrait, portraitCanvas, prepareStoryFile, recordingMimeType } from '@/lib/story-media'
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
  const [cameraReady,setCameraReady] = useState(false)
  const cameraRequest = useRef(0)
  const framing = useRef<ReturnType<typeof capturePortrait> | null>(null)
  const preparation = useRef<AbortController | null>(null)
  const [recording, setRecording] = useState(false)
  const [opening, setOpening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const publishing = useRef(false)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)
  const pendingIds = stories.filter(s => s.status === 'processing').map(s => s.id).join(',')
  useEffect(() => {
    if (!pendingIds) return
    let active = true, running = false, cursor = 0
    const ids = pendingIds.split(',')
    const poll = async () => {
      if (running || document.hidden) return
      running = true
      try {
        const batch = ids.slice(cursor, cursor + 5)
        cursor = (cursor + batch.length) % ids.length
        const results = await Promise.all(batch.map(finishCaseStory))
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
      cameraRequest.current++
      preparation.current?.abort()
      framing.current?.stop()
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

  async function selectFile(next: File | undefined) {
    if (!next) return
    const image = ['image/jpeg','image/png','image/webp'].includes(next.type)
    if ((!image && !next.type.startsWith('video/')) || next.size > (image ? 10*1024**2 : 1024**3) || !next.size) { setMessage('Escolha um vídeo de até 1 GB ou imagem JPG, PNG ou WebP de até 10 MB.'); return }
    preparation.current?.abort()
    const controller=new AbortController();preparation.current=controller
    setFile(null);setBusy(true);setMessage('Preparando mídia vertical…')
    try {const ready=await prepareStoryFile(next,controller.signal,setMessage);if(mounted.current && !controller.signal.aborted){setFile(ready);setMessage('Mídia pronta em 9:16.')}}
    catch(error){if(mounted.current) setMessage(error instanceof Error?error.message:'Não foi possível preparar a mídia.')}
    finally {if(preparation.current===controller)preparation.current=null;if(mounted.current) setBusy(false)}
  }
  function closeCamera() {
    cameraRequest.current++
    if(recorder.current?.state==='recording') recorder.current.stop()
    else {framing.current?.stop();stream.current?.getTracks().forEach(t=>t.stop())}
    if(video.current) video.current.srcObject=null
    setCameraReady(false);setOpening(false)
  }
  async function record() {
    if(opening || recording || busy || cameraReady) return
    const request=++cameraRequest.current
    setMessage('');setOpening(true)
    let source:MediaStream | undefined
    try {
      if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Este navegador não abre a câmera. Use a opção Câmera do celular abaixo.')
      recordingMimeType()
      source=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:720},height:{ideal:1280},aspectRatio:{ideal:9/16}},audio:true})
      if(!mounted.current || request!==cameraRequest.current){source.getTracks().forEach(t=>t.stop());return}
      stream.current=source
      if(!video.current) throw new Error('Prévia da câmera indisponível.')
      video.current.srcObject=source;video.current.muted=true;await video.current.play()
      if(!mounted.current || request!==cameraRequest.current){source.getTracks().forEach(t=>t.stop());return}
      setCameraReady(true)
    } catch(error) {
      source?.getTracks().forEach(t=>t.stop())
      if(mounted.current && request===cameraRequest.current) setMessage(error instanceof DOMException && error.name==='NotAllowedError' ? 'Permita câmera e microfone nas configurações do navegador. Você também pode usar Câmera do celular.' : error instanceof Error?error.message:'Não foi possível abrir a câmera.')
    } finally {if(mounted.current && request===cameraRequest.current) setOpening(false)}
  }
  async function takePhoto() {
    if(!cameraReady || recording || !video.current) return
    setBusy(true)
    try {
      const frame=portraitCanvas();frame.draw(video.current,video.current.videoWidth,video.current.videoHeight)
      const blob=await new Promise<Blob>((resolve,reject)=>frame.canvas.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível tirar a foto.')),'image/jpeg',0.92))
      closeCamera()
      if(mounted.current){setFile(new File([blob],'story-'+Date.now()+'.jpg',{type:'image/jpeg'}));setMessage('Foto pronta em 9:16. Confira e publique.')}
    }catch(error){setMessage(error instanceof Error?error.message:'Não foi possível tirar a foto.')}finally{if(mounted.current)setBusy(false)}
  }
  function startRecording() {
    if(!cameraReady || recording || recorder.current?.state==='recording' || !video.current || !stream.current) return
    try {
      framing.current=capturePortrait(video.current,stream.current.getAudioTracks())
      const mimeType=recordingMimeType(),chunks:Blob[]=[]
      const capture=new MediaRecorder(framing.current.stream,mimeType?{mimeType,videoBitsPerSecond:2500000}:undefined)
      recorder.current=capture
      capture.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)}
      capture.onstop=()=>{
        if(timer.current)clearTimeout(timer.current)
        framing.current?.stop();stream.current?.getTracks().forEach(t=>t.stop())
        if(video.current)video.current.srcObject=null
        if(!mounted.current)return
        setRecording(false);setCameraReady(false)
        const file=new File(chunks,'story-'+Date.now()+(capture.mimeType.includes('mp4')?'.mp4':'.webm'),{type:capture.mimeType})
        if(file.size){setFile(file);setMessage('Gravação pronta em 9:16. Confira e publique.')}else setMessage('A gravação ficou vazia. Tente novamente.')
      }
      capture.onerror=()=>{setMessage('Gravação interrompida. Confira a prévia antes de publicar.');if(capture.state==='recording')capture.stop()}
      capture.start(1000);setFile(null);setRecording(true)
      timer.current=setTimeout(()=>{if(capture.state==='recording')capture.stop()},300000)
    } catch(error){framing.current?.stop();setMessage(error instanceof Error?error.message:'Não foi possível gravar. Use Câmera do celular.')}
  }
  useEffect(()=>{
    const hidden=()=>{if(document.hidden && recorder.current?.state==='recording')recorder.current.stop()}
    document.addEventListener('visibilitychange',hidden)
    return ()=>document.removeEventListener('visibilitychange',hidden)
  },[])
  async function check(id: string) {
    setBusy(true)
    try {
      const result = await finishCaseStory(id)
      setMessage(result.error || (result.status === 'published' ? 'Story publicado! Ele já está na página inicial e na área de casos.' : result.status === 'error' ? 'O vídeo não pôde ser processado. Envie outro arquivo.' : 'Vídeo em processamento. A publicação acontece automaticamente quando estiver pronto.'))
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
    if (!file || busy || opening || cameraReady || recording || publishing.current || (!caseId && !caseTitle.trim())) return
    publishing.current = true
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
      setMessage(status.error || (status.status === 'published' ? 'Story publicado! Ele já está na página inicial e na área de casos.' : 'Envio concluído. Processando e publicando automaticamente; você já pode enviar outro story.'))
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível enviar o vídeo.') }
    finally { publishing.current = false; setBusy(false) }
  }
  return <section className="space-y-5 rounded-2xl border border-amf-border bg-white p-5">
    <div><h2 className="text-xl font-semibold">Publicar story de um caso</h2><p className="text-sm text-amf-muted">Grave ou envie um vídeo ou imagem, confira e escolha o caso. Após publicar, o story aparece por 48 horas na home e fica salvo no caso. Todas as mídias são preparadas em 9:16, sem cortar conteúdo. Vídeos aparecem quando o processamento terminar.</p></div>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy || opening} onClick={() => recording ? (recorder.current?.state === 'recording' && recorder.current.stop()) : cameraReady ? startRecording() : void record()} className="rounded-full bg-amf-petrol-700 px-5 py-2 text-white disabled:opacity-50">{opening ? 'Abrindo câmera…' : recording ? 'Parar gravação' : cameraReady ? 'Iniciar gravação' : 'Abrir câmera'}</button>
      <label className="rounded-full border px-5 py-2">Enviar vídeo ou imagem<input aria-label="Enviar vídeo ou imagem" type="file" accept="video/*,image/jpeg,image/png,image/webp" disabled={busy || recording || opening || cameraReady} onChange={event => { selectFile(event.target.files?.[0]); event.target.value='' }} className="block max-w-full text-sm" /></label>
      <label className="rounded-xl border px-4 py-3">Câmera do celular<input aria-label="Câmera do celular" type="file" accept="video/*" capture="user" disabled={busy || opening || cameraReady || recording} onChange={event=>{void selectFile(event.target.files?.[0]);event.target.value=''}} className="block max-w-full text-sm" /></label>
    </div>
    {cameraReady && !recording && <button type="button" disabled={busy} onClick={takePhoto} className="rounded-xl border px-4 py-3">Tirar foto</button>}
    {(opening || cameraReady) && <button type="button" onClick={closeCamera} className="rounded-xl border px-4 py-3">{recording ? 'Encerrar gravação' : 'Fechar câmera'}</button>}
    <video ref={video} muted playsInline autoPlay className={cameraReady || opening || recording ? 'mx-auto aspect-[9/16] w-full max-w-[288px] rounded-2xl bg-black object-contain' : 'hidden'} />
    {recording && <p role="status">Gravando — limite de 5 minutos por gravação.</p>}
    {preview && (file?.type.startsWith('image/') ? <img src={preview} alt="Prévia do story" className="mx-auto aspect-[9/16] w-full max-w-[288px] rounded-2xl bg-black object-contain" /> : <video src={preview} controls playsInline preload="metadata" className="mx-auto aspect-[9/16] w-full max-w-[288px] rounded-2xl bg-black object-contain" />)}
    <label className="block">Caso<select value={caseId} onChange={event => setCaseId(event.target.value)} disabled={busy} className="mt-1 block w-full rounded-xl border p-3"><option value="">Criar novo caso</option>{cases.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    {!caseId && <label className="block">Nome do novo caso<input value={caseTitle} maxLength={160} disabled={busy} onChange={event => setCaseTitle(event.target.value)} className="mt-1 block w-full rounded-xl border p-3" /></label>}
    <label className="block">Título ou legenda do story<textarea value={caption} maxLength={500} disabled={busy} onChange={event => setCaption(event.target.value)} className="mt-1 block w-full rounded-xl border p-3" /></label>
    <div className="space-y-3 rounded-xl border border-amf-border bg-white p-4">
    <p className="text-sm text-amf-muted">{!file ? 'Grave ou selecione uma foto ou vídeo para publicar.' : !caseId && !caseTitle.trim() ? 'Dê um nome ao novo caso para liberar a publicação.' : 'Tudo pronto. Publique para mostrar este story na página inicial.'}</p>
    <button type="button" disabled={busy || opening || cameraReady || recording || !file || (!caseId && !caseTitle.trim())} onClick={publish} className="min-h-12 w-full rounded-xl bg-amf-petrol-700 px-5 py-3 font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amf-petrol-700 disabled:cursor-not-allowed disabled:opacity-60">{busy ? `Aguarde… ${progress}%` : 'Publicar story'}</button>
    {busy && preparation.current && <button type="button" onClick={()=>preparation.current?.abort()} className="rounded-xl border px-4 py-3">Cancelar preparação</button>}
    {message && <p role="status" className="text-sm">{message}</p>}
    </div>
    <div className="border-t pt-4"><h3 className="font-semibold">Acompanhamento dos envios</h3>{stories.length === 0 && <p className="text-sm text-amf-muted">Nenhum envio pendente. Os stories publicados estão em Casos clínicos.</p>}{stories.map(story => <div key={story.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-3"><span>{cases.find(c => c.id === story.case_id)?.title || 'Caso'}{story.caption ? ` — ${story.caption}` : ''}<small className="block">{story.status === 'published' ? 'Publicado' : story.status === 'error' ? 'Falha no processamento — envie outro vídeo' : 'Processando'}</small></span>{story.status === 'processing' && <button type="button" disabled={busy} onClick={() => check(story.id)} className="rounded-full border px-3 py-2 text-sm">Verificar publicação</button>}<button type="button" disabled={busy} onClick={() => remove(story.id)} className="rounded-full border px-3 py-2 text-sm">Remover story</button></div>)}</div>
  </section>
}
