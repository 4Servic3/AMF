'use client'
import Link from 'next/link'
import { StoryPlayer } from '@/components/casos/PublishedCaseStories'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { archiveCaseStory } from '@/app/admin/actions/case-stories'
import { storyIsRecent } from '@/lib/story-lifecycle'
import type { CaseStoryRow } from '@/lib/case-stories'
type Case = {id:string;title:string;case_story_videos:(CaseStoryRow & {published_at:string|null})[]}
export default function CaseStoryArchive({cases}:{cases:Case[]}) {
 const [active,setActive]=useState<CaseStoryRow|null>(null)
 const dialog = useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!active) return
  const previous=document.activeElement as HTMLElement|null, overflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape')setActive(null)
   if(event.key==='Tab'){
    const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]')
    if(!nodes?.length)return
    if(event.shiftKey && document.activeElement===nodes[0]){event.preventDefault();nodes[nodes.length-1].focus()}
    else if(!event.shiftKey && document.activeElement===nodes[nodes.length-1]){event.preventDefault();nodes[0].focus()}
   }
  }
  document.addEventListener('keydown',key)
  return ()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus()}
 },[active])
 const router=useRouter(), [busy,setBusy]=useState(''), [message,setMessage]=useState('')
 async function remove(id:string) {
   if(busy || !window.confirm('Remover este story da home e do arquivo dos membros?')) return
   setBusy(id)
   try {const result=await archiveCaseStory(id);setMessage(result.error || 'Story removido.');router.refresh()} catch {setMessage('Não foi possível remover. Tente novamente.')} finally {setBusy('')}
 }
 return <div className="space-y-5">{active && <div ref={dialog} role="dialog" aria-modal="true" aria-label="Prévia do story" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-4"><button autoFocus onClick={()=>setActive(null)} className="mb-3 rounded-xl border border-white/40 px-5 py-3 text-white">Fechar prévia</button><div className="aspect-[9/16] w-full bg-black" style={{maxWidth:'min(360px,calc((100dvh - 110px)*9/16))'}}><StoryPlayer story={active} onEnded={()=>setActive(null)}/></div></div>}{message && <p role="status">{message}</p>}{!cases.length && <p className="rounded-3xl border bg-white p-8">Os casos aparecerão aqui após a criação.</p>}{cases.map(c=>{
 const stories=c.case_story_videos.filter(s=>s.status==='published').sort((a,b)=>a.created_at.localeCompare(b.created_at))
 return <section key={c.id} className="rounded-3xl border border-amf-border/50 bg-white p-5 shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">{c.title}</h2><p className="text-sm text-amf-muted">{stories.length} stories salvos</p></div><Link className="rounded-xl border px-4 py-3 text-sm text-amf-petrol-700" href={'/admin/stories?case='+c.id}>Adicionar story</Link></header><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{stories.map(s=><article key={s.id} className="min-w-0"><button type="button" aria-label={'Assistir story: '+(s.caption||c.title)} onClick={()=>setActive(s)} className="block w-full aspect-[9/16] overflow-hidden rounded-2xl bg-amf-ivory-100"><img src={'/api/case-stories/'+s.id+'/thumbnail'} alt={s.caption||c.title} loading="lazy" className="h-full w-full object-contain" /></button><p className="mt-2 line-clamp-2 text-sm font-medium">{s.caption || 'Sem legenda'}</p><p className="text-xs text-amf-muted">{storyIsRecent(s.published_at)?'Na home por até 48h':'Salvo no caso'}</p><button disabled={!!busy} onClick={()=>remove(s.id)} className="mt-2 min-h-11 text-sm text-amf-error disabled:opacity-50">Remover story</button></article>)}</div>{!stories.length && <p className="mt-4 text-sm text-amf-muted">Nenhum story publicado neste caso.</p>}</section>
 })}</div>
}
