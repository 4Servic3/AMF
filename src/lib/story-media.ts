import { portraitContain } from './story-lifecycle'
export function recordingMimeType() {
  if (typeof MediaRecorder === 'undefined') throw new Error('Use a câmera do celular ou envie um vídeo vertical neste navegador.')
  return ['video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type))
}
export function portraitCanvas() {
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280
 const context=canvas.getContext('2d')
 if(!context) throw new Error('Não foi possível preparar o quadro vertical.')
 return {canvas,draw(source:CanvasImageSource,width:number,height:number){
   const r=portraitContain(width,height)
   context.fillStyle='#000';context.fillRect(0,0,720,1280)
   context.drawImage(source,r.x,r.y,r.width,r.height)
 }}
}
export function capturePortrait(video:HTMLVideoElement,audio:MediaStreamTrack[] = []) {
 const frame=portraitCanvas()
 if(!frame.canvas.captureStream) throw new Error('Este navegador não grava em 9:16. Use a câmera do celular e envie um vídeo vertical.')
 const draw=()=>{if(video.videoWidth&&video.videoHeight) frame.draw(video,video.videoWidth,video.videoHeight)}
 draw()
 const output=frame.canvas.captureStream(30)
 audio.forEach(t=>output.addTrack(t.clone()))
 const interval=setInterval(draw,1000/30)
 return {stream:output,stop(){clearInterval(interval);output.getTracks().forEach(t=>t.stop())}}
}
function waitMedia(video:HTMLVideoElement,signal:AbortSignal) {
 return new Promise<void>((resolve,reject)=>{
  const done=(error?:Error)=>{clearTimeout(timer);video.onloadedmetadata=null;video.onerror=null;signal.removeEventListener('abort',abort);error?reject(error):resolve()}
  const abort=()=>done(new Error('Preparação cancelada.'))
  const timer=setTimeout(()=>done(new Error('Não foi possível ler o vídeo. Escolha outro arquivo.')),15000)
  video.onloadedmetadata=()=>done();video.onerror=()=>done(new Error('Formato de vídeo não compatível com este navegador.'))
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted) abort()
 })
}
export async function prepareStoryFile(file:File,signal:AbortSignal,onProgress:(message:string)=>void):Promise<File> {
 if(signal.aborted) throw new Error('Preparação cancelada.')
 const url=URL.createObjectURL(file)
 let video:HTMLVideoElement|undefined, audio:AudioContext|undefined
 let capture:ReturnType<typeof capturePortrait>|undefined
 try {
  if(file.type.startsWith('image/')) {
   const img=new Image();img.src=url;await img.decode()
   if(signal.aborted) throw new Error('Preparação cancelada.')
   const frame=portraitCanvas();frame.draw(img,img.naturalWidth,img.naturalHeight)
   const blob=await new Promise<Blob>((resolve,reject)=>frame.canvas.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível preparar a foto.')),'image/jpeg',0.92))
   return new File([blob],'story-'+Date.now()+'.jpg',{type:'image/jpeg'})
  }
  // Resume while the file-picker gesture is still active (important on iOS).
  if(typeof AudioContext !== 'undefined') audio=new AudioContext()
  const audioReady=audio?.resume().then(()=>true,()=>false)
  video=document.createElement('video');video.playsInline=true;video.preload='auto';video.muted=true
  const loaded=waitMedia(video,signal);video.src=url;await loaded
  if(Math.abs(video.videoWidth/video.videoHeight-9/16)<0.005) return file
  recordingMimeType()
  onProgress('Ajustando vídeo para 9:16. Mantenha esta página aberta; isso leva aproximadamente a duração do vídeo.')
  if(!audio || !audioReady || !await Promise.race([audioReady,new Promise<boolean>(resolve=>setTimeout(()=>resolve(false),5000))])) throw new Error('Não foi possível preparar o áudio. Selecione o vídeo novamente ou envie uma versão vertical 9:16.')
  const destination=audio.createMediaStreamDestination()
  audio.createMediaElementSource(video).connect(destination)
  await video.play();video.pause();video.currentTime=0
  capture=capturePortrait(video,destination.stream.getAudioTracks())
  const mimeType=recordingMimeType()
  const recorder=new MediaRecorder(capture.stream,mimeType?{mimeType,videoBitsPerSecond:2500000}:undefined)
  const chunks:Blob[]=[]
  return await new Promise<File>((resolve,reject)=>{
   let failed:Error|undefined, bytes=0
   const fail=(message:string)=>{failed=new Error(message);if(recorder.state!=='inactive') recorder.stop();else reject(failed)}
   const abort=()=>fail('Preparação cancelada.')
   const hidden=()=>{if(document.hidden) fail('A preparação foi interrompida. Mantenha a página visível e selecione o vídeo novamente.')}
   const timeout=setTimeout(()=>fail('O vídeo demorou demais para preparar. Tente um arquivo menor.'),(Number.isFinite(video!.duration)?video!.duration+60:600)*1000)
   const cleanup=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);document.removeEventListener('visibilitychange',hidden)}
   recorder.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);bytes+=e.data.size;if(bytes>1024**3) fail('O vídeo preparado excede 1 GB.')}}
   recorder.onerror=()=>fail('Falha ao preparar o vídeo. Tente novamente.')
   recorder.onstop=()=>{cleanup();if(failed) reject(failed);else if(!bytes) reject(new Error('O vídeo ficou vazio. Tente outro arquivo.'));else resolve(new File(chunks,'story-'+Date.now()+(recorder.mimeType.includes('mp4')?'.mp4':'.webm'),{type:recorder.mimeType}))}
   video!.onended=()=>{if(recorder.state!=='inactive') recorder.stop()}
   video!.onerror=()=>fail('A leitura do vídeo foi interrompida.')
   signal.addEventListener('abort',abort,{once:true});document.addEventListener('visibilitychange',hidden)
   try {recorder.start(1000);void video!.play().catch(()=>fail('Não foi possível iniciar o vídeo. Tente novamente.'))} catch {cleanup();reject(new Error('Não foi possível preparar este vídeo.'))}
   if(signal.aborted) abort()
  })
 } finally {video?.pause();capture?.stop();if(audio) await audio.close().catch(()=>undefined);if(video){video.removeAttribute('src');video.load()}URL.revokeObjectURL(url)}
}
