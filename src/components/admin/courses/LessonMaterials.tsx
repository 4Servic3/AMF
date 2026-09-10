'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
type Material={id:string;name:string;title:string;size_bytes:number};
export default function LessonMaterials({lessonId,onUpdated}:{lessonId:string;onUpdated:()=>void}) {
  const [items,setItems]=useState<Material[]>([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const input=useRef<HTMLInputElement>(null);
  const endpoint='/api/admin/courses/lessons/'+lessonId+'/materials';
  const request=useCallback(async(method='GET',body?:object)=>{
    const res=await fetch(endpoint,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await res.json(); if(!res.ok)throw new Error(data.error||'Não foi possível concluir.'); return data;
  },[endpoint]);
  const refresh=useCallback(async()=>setItems((await request()).materials),[request]);
  useEffect(()=>{refresh().catch(()=>setMessage('Não foi possível carregar os materiais.'));},[refresh]);
  useEffect(()=>{if(!busy)return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[busy]);
  async function upload(files:FileList|null) {
    if(!files?.length)return;
    setBusy(true);setMessage('');
    try {
      for(const file of Array.from(files)) {
        if(!file.size||file.size>50*1024*1024)throw new Error(file.name+': o limite é 50 MB por arquivo.');
        setMessage('Enviando '+file.name+'…');
        const created=await request('POST',{name:file.name,size:file.size,mime:file.type});
        const {error}=await createClient().storage.from('lesson-files').uploadToSignedUrl(created.path,created.token,file,{contentType:file.type||'application/octet-stream'});
        if(error)throw new Error('Falha no envio de '+file.name+'. Selecione o arquivo para tentar novamente.');
        await request('PATCH',{id:created.id});
        await refresh();onUpdated();
      }
      setMessage('Materiais salvos na aula.');
    } catch(e) {setMessage(e instanceof Error?e.message:'Não foi possível enviar.');}
    finally {setBusy(false);if(input.current)input.current.value='';}
  }
  return <section aria-label="Materiais da aula" className="rounded-xl border border-amf-border bg-white p-5 space-y-3">
    <h3 className="font-semibold">Arquivos e materiais da aula</h3>
    <p className="text-sm text-amf-muted-600">PDFs, planilhas, documentos e outros arquivos, até 50 MB cada. Você pode adicionar materiais com ou sem vídeo. Os alunos terão acesso após a publicação da aula.</p>
    <input ref={input} type="file" multiple hidden onChange={e=>upload(e.target.files)} />
    <button type="button" disabled={busy} onClick={()=>input.current?.click()} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">{busy?'Enviando materiais…':'Adicionar arquivos'}</button>
    {message&&<p role="status" className="text-sm">{message}</p>}
    {items.map(item=><div key={item.id} className="flex justify-between gap-3 text-sm border-t pt-3"><span>{item.name||item.title} · {(item.size_bytes/1024/1024).toFixed(1)} MB</span><button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await request('DELETE',{id:item.id});await refresh();onUpdated();}catch{setMessage('Não foi possível remover o material.');}finally{setBusy(false);}}}>Remover</button></div>)}
  </section>;
}
