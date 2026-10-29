'use client'
import Link from 'next/link'
import { StoryPlayer } from '@/components/casos/PublishedCaseStories'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { archiveCaseStory, reorderCaseStories } from '@/app/admin/actions/case-stories'
import { storyIsRecent } from '@/lib/story-lifecycle'
import type { CaseStoryRow } from '@/lib/case-stories'
type Story = CaseStoryRow & {published_at:string|null}
type Case = {id:string;title:string;case_story_videos:Story[]}
const thumb=(id:string)=>'/api/case-stories/'+id+'/thumbnail'
const published=(c:Case)=>c.case_story_videos.filter(s=>s.status==='published').sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id))
export default function CaseStoryArchive({cases}:{cases:Case[]}) {
 const [active,setActive]=useState<CaseStoryRow|null>(null)
 const [openId,setOpenId]=useState('')
 const [order,setOrder]=useState<Story[]|null>(null)
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
 const open=cases.find(c=>c.id===openId)
 const stories=open?(order||published(open)):[]
 function choose(id:string){setOpenId(id);setOrder(null);setMessage('');window.scrollTo({top:0})}
 async function remove(id:string) {
   if(busy || !window.confirm('Remover este story da home e do arquivo dos membros?')) return
   setBusy(id)
   try {const result=await archiveCaseStory(id);setMessage(result.error || 'Story removido.');setOrder(null);router.refresh()} catch {setMessage('Não foi possível remover. Tente novamente.')} finally {setBusy('')}
 }
 async function move(index:number,delta:number) {
   const target=index+delta
   if(busy || !open || target<0 || target>=stories.length) return
   const next=[...stories];[next[index],next[target]]=[next[target],next[index]]
   setOrder(next);setBusy('order');setMessage('')
   try {
    const result=await reorderCaseStories(open.id,next.map(s=>s.id))
    if(result.error){setMessage(result.error);setOrder(null)} else {setMessage('Ordem salva.');router.refresh()}
   } catch {setMessage('Não foi possível salvar a ordem.');setOrder(null)} finally {setBusy('')}
 }
 const preview = active && <div ref={dialog} role="dialog" aria-modal="true" aria-label="Prévia do story" className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-4"><button autoFocus onClick={()=>setActive(null)} className="mb-3 rounded-xl border border-white/40 px-5 py-3 text-white">Fechar prévia</button><div className="aspect-[9/16] w-full bg-black" style={{maxWidth:'min(360px,calc((100dvh - 110px)*9/16))'}}><StoryPlayer story={active} onEnded={()=>setActive(null)}/></div></div>
 if(open) return <div className="space-y-5">{preview}
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><button type="button" onClick={()=>choose('')} className="text-sm font-semibold text-[var(--admin-tint)]">‹ Todos os casos</button><h2 className="mt-1 text-2xl">{open.title}</h2><p className="text-sm text-[var(--admin-secondary)]">{stories.length} {stories.length===1?'story':'stories'} · o aluno vê nesta ordem. Use as setas para mudar.</p></div>
   <Link className="amf-primary" href={'/admin/stories?case='+open.id}>Adicionar story</Link>
  </div>
  {message && <p role="status" className="amf-feedback">{message}</p>}
  {!stories.length && <p className="amf-panel text-center text-sm text-[var(--admin-secondary)]">Nenhum story publicado neste caso ainda.</p>}
  <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{stories.map((s,i)=><li key={s.id} className="amf-panel flex min-w-0 flex-col !p-3">
   <button type="button" aria-label={'Assistir story: '+(s.caption||open.title)} onClick={()=>setActive(s)} className="relative block aspect-[9/16] w-full overflow-hidden rounded-xl bg-[var(--admin-fill)]">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={thumb(s.id)} alt={s.caption||open.title} loading="lazy" className="h-full w-full object-cover" />
    <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/90 px-2 text-xs font-bold text-[var(--admin-label)]">{i+1}</span>
    {storyIsRecent(s.published_at) && <span className="absolute bottom-2 left-2 rounded-full bg-[var(--admin-tint)] px-2 py-0.5 text-[11px] font-semibold text-white">Na home</span>}
   </button>
   <p className="mt-2 line-clamp-2 min-h-10 text-sm font-medium">{s.caption || 'Sem legenda'}</p>
   <div className="mt-2 flex items-center justify-between gap-1">
    <div className="flex gap-1"><button type="button" aria-label="Mover para antes" disabled={!!busy||i===0} onClick={()=>move(i,-1)} className="h-10 w-10 rounded-full bg-[var(--admin-fill)] text-lg">‹</button><button type="button" aria-label="Mover para depois" disabled={!!busy||i===stories.length-1} onClick={()=>move(i,1)} className="h-10 w-10 rounded-full bg-[var(--admin-fill)] text-lg">›</button></div>
    <button type="button" disabled={!!busy} onClick={()=>remove(s.id)} className="px-2 text-sm font-semibold text-[var(--admin-danger)]">Remover</button>
   </div>
  </li>)}</ol>
 </div>
 return <div className="space-y-5">{preview}{message && <p role="status" className="amf-feedback">{message}</p>}
  {!cases.length && <p className="amf-panel text-center">Os casos aparecerão aqui após a criação.</p>}
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{cases.map(c=>{
   const list=published(c), cover=list[0], onHome=list.some(s=>storyIsRecent(s.published_at)), pending=c.case_story_videos.filter(s=>s.status!=='published').length
   return <button type="button" key={c.id} onClick={()=>choose(c.id)} className="amf-panel group flex flex-col overflow-hidden !p-0 text-left">
    <span className="relative block aspect-[4/5] w-full bg-[var(--admin-fill)]">
     {/* eslint-disable-next-line @next/next/no-img-element */}
     {cover ? <img src={thumb(cover.id)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" /> : <span className="flex h-full items-center justify-center text-sm text-[var(--admin-tertiary)]">Sem stories</span>}
     {onHome && <span className="absolute left-2 top-2 rounded-full bg-[var(--admin-tint)] px-2 py-0.5 text-[11px] font-semibold text-white">Na home agora</span>}
    </span>
    <span className="block p-4"><span className="block font-semibold leading-snug">{c.title}</span><span className="mt-1 block text-sm text-[var(--admin-secondary)]">{list.length} {list.length===1?'story':'stories'}{pending?` · ${pending} enviando`:''}</span></span>
   </button>
  })}</div>
 </div>
}
