'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const MuxUploader = dynamic(()=>import('@mux/mux-uploader-react'),{ssr:false});
export interface LessonVideoData {
  id:string; status:string; title?:string|null; duration_seconds?:number|null;
  mux_playback_id?:string|null; error_message?:string|null;
}
type Upload = {mux_upload_id:string;status:string;video_assets:LessonVideoData|null};
type LibraryVideo = {id:string;title:string;duration_seconds:number;status:string};
export default function LessonVideoManager({lessonId,lessonTitle,initialVideo=null,onVideoUpdated}:{
  lessonId:string;lessonTitle?:string;initialVideo?:LessonVideoData|null;onVideoUpdated?:()=>void;
}) {
  const base='/api/admin/courses/lessons/'+lessonId;
  const [video,setVideo]=useState(initialVideo);
  const [upload,setUpload]=useState<Upload|null>(null);
  const [sending,setSending]=useState(false);
  const [showUploader,setShowUploader]=useState(false);
  const [uploaderKey,setUploaderKey]=useState(0);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [library,setLibrary]=useState<LibraryVideo[]|null>(null);
  const [page,setPage]=useState(1);
  const [hasMore,setHasMore]=useState(false);
  const uploadId=useRef<string|null>(null);
  const pending=upload?.video_assets;
  const processing=!!pending && pending.id!==video?.id && ['pending','uploading','processing','ready'].includes(pending.status);
  const request=useCallback(async(path:string,method='GET',body?:object)=>{
    const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error || 'Não foi possível concluir.');
    return data;
  },[base]);
  const refresh=useCallback(async()=>{
    const data=await request('/video-status');
    setVideo(data.video);setUpload(data.upload);
    uploadId.current=data.upload?.mux_upload_id || null;
  },[request]);
  useEffect(()=>{refresh().catch(e=>setError(e.message));},[refresh]);
  useEffect(()=>{
    if(!processing || sending) return;
    let stopped=false;
    // Reconcile even when webhook delivery is delayed. No overlapping polls.
    const poll=async()=>{
      if(stopped)return;
      if(document.visibilityState==='visible') {
        try {await request('/video-status','POST');await refresh();setError('');}
        catch(e) {if(!stopped)setError(e instanceof Error?e.message:'Falha ao consultar envio.');}
      }
      if(!stopped) timer=setTimeout(poll,15000);
    };
    let timer=setTimeout(poll,5000);
    return ()=>{stopped=true;clearTimeout(timer);};
  },[processing,sending,refresh,request]);
  useEffect(()=>{
    if(!sending)return;
    const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();};
    window.addEventListener('beforeunload',warn);
    return ()=>window.removeEventListener('beforeunload',warn);
  },[sending]);
  const run=async(work:()=>Promise<void>)=>{
    setBusy(true);setError('');
    try {await work();} catch(e) {setError(e instanceof Error?e.message:'Falha temporária.');}
    finally {setBusy(false);}
  };
  const publish=async(id:string)=>{
    await request('/video-replace','POST',{new_video_asset_id:id});
    await refresh();setLibrary(null);onVideoUpdated?.();
  };
  const loadLibrary=async(nextPage=1)=>{
    const data=await request('/video-associate?page='+nextPage);
    setLibrary(data.videos);setPage(nextPage);setHasMore(data.hasMore);
  };
  const button='rounded-lg border border-amf-border px-4 py-2 text-sm disabled:opacity-50';
  return <section className="rounded-xl border border-amf-border bg-white p-5 space-y-4" aria-label="Vídeo da aula">
    <div><h3 className="font-semibold">Vídeo da aula</h3><p className="text-sm text-amf-muted">{lessonTitle}</p></div>
    <p className="text-sm">{video?.status==='ready'?'Vídeo disponível • '+Math.round((video.duration_seconds||0)/60)+' min':'Esta aula ainda não tem um vídeo pronto.'}</p>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {pending && pending.id!==video?.id && <div className="rounded-lg bg-amber-50 p-4 space-y-3" role="status">
      <p className="text-sm">{pending.status==='ready'?'Finalizando o vínculo automático do vídeo…':pending.status==='errored'?pending.error_message || 'O envio falhou. Tente novamente.':sending?'Enviando arquivo…':'Processando: o vídeo será vinculado automaticamente à aula.'}</p>
    </div>}
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={busy||sending||processing} onClick={()=>setShowUploader(true)}>{video?'Enviar novo vídeo':'Enviar vídeo'}</button>
      <button className={button} disabled={busy||sending||processing} onClick={()=>run(()=>loadLibrary())}>Escolher da biblioteca</button>
      <button className={button} disabled={busy||sending} onClick={()=>run(async()=>{await request('/video-status','POST');await refresh();})}>Verificar status</button>
      {(sending || (processing && upload?.status==='waiting_file')) && <button className={button} disabled={busy} onClick={()=>run(async()=>{
        if(uploadId.current) await request('/video-upload','DELETE',{upload_id:uploadId.current});
        setSending(false);setShowUploader(false);setUploaderKey(k=>k+1);await refresh();
      })}>Cancelar envio</button>}
    </div>
    {showUploader && <div className="space-y-2">
      <MuxUploader key={uploaderKey} pausable locale="pt" dynamicChunkSize endpoint={async()=>{
        setError('');setSending(true);
        try {
          const data=await request('/video-upload','POST');
          uploadId.current=data.upload_id;
          // A status read must never interrupt a successfully allocated upload.
          refresh().catch(()=>{});return data.upload_url;
        } catch(e) {setSending(false);setError(e instanceof Error?e.message:'Erro ao iniciar envio.');throw e;}
      }} onUploadError={()=>{setError('Envio interrompido. Use tentar novamente ou cancele o envio.');}}
      onSuccess={()=>{setSending(false);setShowUploader(false);setUploaderKey(k=>k+1);run(async()=>{await request('/video-status','POST');await refresh();});}}>
        <button slot="file-select" className={button}>Selecionar arquivo de vídeo</button>
      </MuxUploader>
      <p className="text-xs text-amf-muted">O envio pode ser pausado. Mantenha esta página aberta até a transferência terminar; depois você pode voltar para publicar.</p>
    </div>}
    {library && <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between"><h4 className="font-medium">Biblioteca de vídeos</h4><button onClick={()=>setLibrary(null)}>Fechar</button></div>
      {library.length===0 && <p>Nenhum vídeo encontrado.</p>}
      {library.map(item=><div key={item.id} className="flex justify-between items-center gap-3 border-b py-3">
        <span className="text-sm">{item.title} • {Math.round(item.duration_seconds/60)} min</span>
        <button className={button} disabled={busy||item.status!=='ready'} onClick={()=>run(async()=>{
          const data=await request('/video-associate','POST',{mux_asset_id:item.id});await publish(data.video_asset_id);
        })}>{item.status==='ready'?'Usar nesta aula':'Processando'}</button>
      </div>)}
      <div className="flex gap-2"><button className={button} disabled={busy||page===1} onClick={()=>run(()=>loadLibrary(page-1))}>Anterior</button><button className={button} disabled={busy||!hasMore} onClick={()=>run(()=>loadLibrary(page+1))}>Próxima</button></div>
    </div>}
  </section>;
}
