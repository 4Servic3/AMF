'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { storyIsRecent, STORY_HOME_LIFETIME_MS } from '@/lib/story-lifecycle'
import { getCaseStoryPlayback } from '@/app/app/casos/actions'
import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'
import { gatewayHref, PRODUCT_SLUGS } from '@/lib/commerce/gateway'

const CASES_GATEWAY = gatewayHref({ kind: 'product', slug: PRODUCT_SLUGS.casos }, 'casos')

const MuxPlayer = dynamic(() => import('@mux/mux-player-react/lazy'),{ssr:false})
type Item = {id:string;caption:string;publishedAt?:string;locked?:boolean}
export type PublishedCase = {id:string;title:string;items:Item[];hasFullAccess:boolean}

function CaseCover({storyId,title,large=false}:{storyId:string;title:string;large?:boolean}) {
  const [failed,setFailed] = useState(false)
  return <span aria-hidden className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-amf-petrol-700 bg-amf-petrol-700/10 ${large ? 'h-24 w-24' : 'h-16 w-16'}`}>
    {failed ? <span className="text-xl font-semibold text-amf-petrol-700">{title.trim().slice(0,2).toUpperCase()}</span> :
      <img src={'/api/case-stories/' + encodeURIComponent(storyId) + '/thumbnail'} alt="" loading="lazy" decoding="async" width={large ? 96 : 64} height={large ? 96 : 64} className="h-full w-full object-cover" onError={()=>setFailed(true)} />}
  </span>
}

function StoryImage({url,title,onEnded,onError}:{url:string;title:string;onEnded:()=>void;onError:()=>void}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const next = useRef(onEnded)
  useEffect(()=>{next.current=onEnded},[onEnded])
  useEffect(()=>()=>{if(timer.current) clearTimeout(timer.current)},[])
  return <img src={url} alt={title} className="h-full w-full object-contain" onLoad={()=>{if(timer.current) clearTimeout(timer.current);timer.current=setTimeout(()=>next.current(),8000)}} onError={()=>{if(timer.current) clearTimeout(timer.current);onError()}} />
}

export function StoryPlayer({story,onEnded}: {story:Item;onEnded:()=>void}) {
  const [playback,setPlayback] = useState<Awaited<ReturnType<typeof getCaseStoryPlayback>> | null>(null)
  const [attempt,setAttempt] = useState(0)
  useEffect(() => {
    if (story.locked) return
    let active = true
    getCaseStoryPlayback(story.id).then(value => {if(active) setPlayback(value)}).catch(() => {if(active) setPlayback({error:'Não foi possível carregar o vídeo.'})})
    return () => {active=false}
  }, [story.id,attempt])
  if (story.locked) return <div className="flex h-full w-full flex-col items-center justify-center bg-[#160820] px-8 text-center text-white"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#E7B64F]/15 text-[#E7B64F]"><Lock size={24}/></span><h2 className="mt-5 font-editorial text-2xl">Continue acompanhando este caso</h2><p className="mt-3 max-w-xs text-sm leading-6 text-white/70">Você assistiu à prévia gratuita. Libere o acesso completo para acompanhar todos os stories e o arquivo de casos.</p><Link href={CASES_GATEWAY} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E7B64F] px-6 font-semibold text-[#160820]"><Sparkles size={17}/> Liberar acesso completo</Link></div>
  if (!playback) return <p role="status" className="p-8 text-white">Carregando story…</p>
  if (playback.imageUrl) return <StoryImage url={playback.imageUrl} title={story.caption || 'Imagem do caso'} onEnded={onEnded} onError={()=>setPlayback({error:'Não foi possível carregar a imagem.'})} />
  if (playback.error || !playback.playbackId) return <div className="p-8 text-white"><p role="alert">{playback.error}</p><button onClick={() => {setPlayback(null);setAttempt(a=>a+1)}} className="mt-4 underline">Tentar novamente</button></div>
  return <MuxPlayer playbackId={playback.playbackId} tokens={playback.tokens} streamType="on-demand" playbackRates={[1, 1.5, 2]} autoPlay="any" playsInline onEnded={onEnded} onError={() => setPlayback({error:'A reprodução foi interrompida. Tente novamente.'})} style={{height:'100%',width:'100%'}} />
}

export default function PublishedCaseStories({cases, compact = false}: {cases:PublishedCase[]; compact?:boolean}) {
  const [now,setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!compact) return
    const update = () => setNow(Date.now())
    const dates = cases.flatMap(c => c.items.map(s => Date.parse(s.publishedAt || '') + STORY_HOME_LIFETIME_MS)).filter(t => t > now)
    const timeout = dates.length ? setTimeout(update, Math.min(Math.max(0,Math.min(...dates)-Date.now())+20,2147483647)) : undefined
    document.addEventListener('visibilitychange',update)
    return () => { clearTimeout(timeout); document.removeEventListener('visibilitychange',update) }
  },[cases,compact,now])
  const visibleCases = compact ? cases.map(c => ({...c,items:c.items.filter(s=>storyIsRecent(s.publishedAt,now))})).filter(c=>c.items.length) : cases
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
  return <section aria-label={compact ? "Stories dos casos" : "Casos clínicos"} className={compact ? "w-full min-w-0 px-5 pt-1 pb-0" : "mx-auto max-w-5xl space-y-7 px-5 py-8 sm:px-8"}>
    {compact ? null : <div className="relative overflow-hidden rounded-[28px] bg-[#160820] px-6 py-8 text-white shadow-[0_18px_45px_rgba(22,8,32,.15)] sm:px-9 sm:py-10"><div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-[#E7B64F]/20"/><div className="absolute -right-4 -top-8 h-40 w-40 rounded-full border border-[#E7B64F]/15"/><span className="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-[#E7B64F]"><Sparkles size={14}/> Biblioteca clínica</span><h1 className="relative mt-4 font-editorial text-3xl font-semibold sm:text-4xl">Casos clínicos</h1><p className="relative mt-2 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Acompanhe histórias, evolução e decisões clínicas em uma experiência visual feita para aprender caso a caso.</p></div>}
    {!compact && !cases.length && <div className="rounded-[24px] border border-[#DED5C8] bg-white px-6 py-10 text-center shadow-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F1E8D9] text-[#0E5B5C]"><Sparkles size={22}/></span><h2 className="mt-4 font-editorial text-xl font-semibold text-[#160820]">Novos casos em preparação</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#657080]">Os casos publicados aparecerão aqui para você acompanhar cada atualização.</p></div>}
    {!compact && cases.length > 0 && !cases[0].hasFullAccess && <div className="flex flex-col gap-4 rounded-[24px] border border-[#E7B64F]/40 bg-[#FBF6EC] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E7B64F]/20 text-[#8A6516]"><Lock size={18} aria-hidden/></span><p className="text-sm leading-6 text-[#625C62]"><strong className="block text-[#160820]">Você está na prévia gratuita</strong>O primeiro story de cada caso é liberado. Os demais fazem parte do acesso completo.</p></div><Link href={CASES_GATEWAY} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#0E5B5C] px-5 text-sm font-semibold text-white hover:bg-[#004F4D]"><Sparkles size={16} aria-hidden/> Liberar acesso completo</Link></div>}
    {!compact && cases.length > 0 && <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#0E5B5C]">Arquivo de casos</p><h2 className="mt-1 font-editorial text-2xl font-semibold text-[#160820]">Acompanhe a evolução</h2></div><span className="rounded-full bg-[#F1E8D9] px-3 py-1.5 text-xs font-semibold text-[#625C62]">{cases.length} {cases.length === 1 ? 'caso' : 'casos'}</span></div>}
    <div className={compact ? "flex gap-4 overflow-x-auto pb-2" : "grid gap-4 sm:grid-cols-2"}>{visibleCases.map(item => <button key={item.id} onClick={() => {setIndex(0);setActive(item)}} className={compact ? "flex w-28 shrink-0 flex-col items-center gap-2 rounded-xl p-1 text-center focus-visible:outline-2 focus-visible:outline-amf-petrol-700" : "group flex items-center gap-4 rounded-[22px] border border-[#DED5C8] bg-white p-4 text-left shadow-[0_5px_18px_rgba(22,8,32,.04)] transition hover:-translate-y-0.5 hover:border-[#0E5B5C]/40 hover:shadow-md"}><CaseCover key={item.items[0].id} storyId={item.items[0].id} title={item.title} large={compact} /><span className="min-w-0 flex-1"><strong className="block line-clamp-2 text-sm font-semibold text-[#160820]">{item.title}</strong>{!compact && <span className="mt-1 block text-xs text-[#657080]">{item.items.length} {item.items.length === 1 ? 'story' : 'stories'} · {item.hasFullAccess ? 'Acesso completo' : 'Prévia disponível'}</span>}</span>{!compact && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1E8D9] text-[#0E5B5C] group-hover:bg-[#0E5B5C] group-hover:text-white"><span aria-hidden>›</span></span>}</button>)}</div>
    {active && createPortal(<div role="dialog" aria-modal="true" aria-label={active.title} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95">
      <div className="flex h-[100dvh] w-full max-w-lg flex-col bg-black text-white">
        <div className="flex gap-1 px-4 pt-3">{active.items.map((item,i)=><div key={item.id} className={`h-1 flex-1 rounded ${i<=index ? 'bg-white' : 'bg-white/30'}`} />)}</div>
        <div className="flex items-center justify-between gap-4 p-4"><span>{active.title} · {index+1}/{active.items.length}</span><button ref={close} aria-label="Fechar stories" onClick={()=>setActive(null)} className="p-2 text-xl">✕</button></div>
        <div className="min-h-0 flex-1 flex items-center justify-center"><div className="relative aspect-[9/16] max-h-full max-w-full bg-black" style={{width:'min(100%, calc((100dvh - 220px) * 9 / 16))'}}><StoryPlayer key={active.items[index].id} story={active.items[index]} onEnded={next} /></div></div>
        {active.items[index].caption && <p className="line-clamp-2 px-4 pt-3 text-sm">{active.items[index].caption}</p>}
        <div className="flex justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button disabled={index===0} onClick={()=>setIndex(i=>i-1)} className="rounded-full border px-4 py-2 disabled:opacity-30">Anterior</button><button onClick={next} className="rounded-full border px-4 py-2">{index+1<active.items.length?'Próximo':'Concluir'}</button></div>
      </div>
    </div>, document.body)}
  </section>
}
