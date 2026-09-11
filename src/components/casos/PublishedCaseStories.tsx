'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { getCaseStoryPlayback } from '@/app/app/casos/actions'

const MuxPlayer = dynamic(() => import('@mux/mux-player-react/lazy'),{ssr:false})
type Item = {id:string;caption:string}
export type PublishedCase = {id:string;title:string;items:Item[]}

function StoryImage({url,title,onEnded,onError}:{url:string;title:string;onEnded:()=>void;onError:()=>void}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const next = useRef(onEnded)
  useEffect(()=>{next.current=onEnded},[onEnded])
  useEffect(()=>()=>{if(timer.current) clearTimeout(timer.current)},[])
  return <img src={url} alt={title} className="h-full w-full object-contain" onLoad={()=>{if(timer.current) clearTimeout(timer.current);timer.current=setTimeout(()=>next.current(),8000)}} onError={()=>{if(timer.current) clearTimeout(timer.current);onError()}} />
}

function StoryPlayer({story,onEnded}: {story:Item;onEnded:()=>void}) {
  const [playback,setPlayback] = useState<Awaited<ReturnType<typeof getCaseStoryPlayback>> | null>(null)
  const [attempt,setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    getCaseStoryPlayback(story.id).then(value => {if(active) setPlayback(value)}).catch(() => {if(active) setPlayback({error:'Não foi possível carregar o vídeo.'})})
    return () => {active=false}
  }, [story.id,attempt])
  if (!playback) return <p role="status" className="p-8 text-white">Carregando vídeo…</p>
  if (playback.imageUrl) return <StoryImage url={playback.imageUrl} title={story.caption || 'Imagem do caso'} onEnded={onEnded} onError={()=>setPlayback({error:'Não foi possível carregar a imagem.'})} />
  if (playback.error || !playback.playbackId) return <div className="p-8 text-white"><p role="alert">{playback.error}</p><button onClick={() => {setPlayback(null);setAttempt(a=>a+1)}} className="mt-4 underline">Tentar novamente</button></div>
  return <MuxPlayer playbackId={playback.playbackId} tokens={playback.tokens} streamType="on-demand" autoPlay="any" playsInline onEnded={onEnded} onError={() => setPlayback({error:'A reprodução foi interrompida. Tente novamente.'})} style={{height:'100%',width:'100%'}} />
}

export default function PublishedCaseStories({cases}: {cases:PublishedCase[]}) {
  const [active,setActive] = useState<PublishedCase | null>(null)
  const [index,setIndex] = useState(0)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow='hidden'; close.current?.focus()
    const key = (event:KeyboardEvent) => {if(event.key==='Escape') setActive(null)}
    document.addEventListener('keydown',key)
    return () => {document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus()}
  }, [active])
  const next = () => {if (active && index+1<active.items.length) setIndex(i=>i+1); else setActive(null)}
  return <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
    <div><h1 className="font-editorial text-3xl">Casos clínicos</h1><p className="mt-2 text-amf-muted">Acompanhe os vídeos e as atualizações de cada caso.</p></div>
    {!cases.length && <p className="rounded-2xl border p-6">Ainda não há casos publicados. Os novos stories aparecerão aqui.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{cases.map(item => <button key={item.id} onClick={() => {setIndex(0);setActive(item)}} className="flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm"><span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-amf-teal-600 text-2xl">▶</span><span><strong className="block">{item.title}</strong><span className="text-sm text-amf-muted">{item.items.length} {item.items.length === 1 ? 'story' : 'stories'} · Assistir</span></span></button>)}</div>
    {active && <div role="dialog" aria-modal="true" aria-label={active.title} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95">
      <div className="flex h-[100dvh] w-full max-w-lg flex-col bg-black text-white">
        <div className="flex gap-1 px-4 pt-3">{active.items.map((item,i)=><div key={item.id} className={`h-1 flex-1 rounded ${i<=index ? 'bg-white' : 'bg-white/30'}`} />)}</div>
        <div className="flex items-center justify-between gap-4 p-4"><span>{active.title} · {index+1}/{active.items.length}</span><button ref={close} aria-label="Fechar stories" onClick={()=>setActive(null)} className="p-2 text-xl">✕</button></div>
        <div className="min-h-0 flex-1"><StoryPlayer key={active.items[index].id} story={active.items[index]} onEnded={next} /></div>
        {active.items[index].caption && <p className="px-4 pt-3 text-sm">{active.items[index].caption}</p>}
        <div className="flex justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button disabled={index===0} onClick={()=>setIndex(i=>i-1)} className="rounded-full border px-4 py-2 disabled:opacity-30">Anterior</button><button onClick={next} className="rounded-full border px-4 py-2">{index+1<active.items.length?'Próximo':'Concluir'}</button></div>
      </div>
    </div>}
  </main>
}
