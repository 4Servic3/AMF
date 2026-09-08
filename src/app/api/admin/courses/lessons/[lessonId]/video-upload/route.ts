import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { requireVideoAdmin, VideoRequestError, videoError, checkDb } from '@/lib/mux/admin';
import { createDirectUpload, getMuxClient } from '@/lib/mux/client';
import { validateRequestOrigin } from '@/lib/mux/origins';
import { checkRateLimit } from '@/lib/security/rate-limit';
export async function POST(req: Request, {params}: {params: Promise<{lessonId:string}>}) {
  let uploadId: string | undefined;
  try {
    const user = await requireVideoAdmin(req);
    if (!checkRateLimit('video_upload_'+user.id,10,600000).allowed) throw new VideoRequestError('Muitos envios. Aguarde alguns minutos.',429);
    const {lessonId} = await params;
    const db = createServiceRoleClient();
    const lesson = await db.from('lessons').select('id').eq('id',lessonId).maybeSingle();
    checkDb(lesson);
    if (!lesson.data) throw new VideoRequestError('Aula não encontrada.',404);
    const videoId = crypto.randomUUID();
    const upload = await createDirectUpload({corsOrigin:validateRequestOrigin(req).origin!,passthrough:videoId});
    uploadId = upload.uploadId;
    const saved = await db.rpc('register_lesson_upload',{p_lesson_id:lessonId,p_video_id:videoId,p_upload_id:uploadId,p_actor_id:user.id});
    if (saved.error?.message?.includes('upload_in_progress')) throw new VideoRequestError('Já existe um envio em andamento. Cancele-o ou aguarde.',409);
    checkDb(saved);
    return Response.json({upload_url:upload.uploadUrl,upload_id:uploadId,video_asset_id:videoId},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    if (uploadId) await getMuxClient().video.uploads.cancel(uploadId).catch(()=>{});
    return videoError(error);
  }
}
export async function DELETE(req: Request, {params}: {params: Promise<{lessonId:string}>}) {
  try {
    await requireVideoAdmin(req);
    const {lessonId} = await params;
    const {upload_id} = await req.json();
    if (typeof upload_id !== 'string') throw new VideoRequestError('Envio inválido.');
    const db = createServiceRoleClient();
    const result = await db.from('video_uploads').select('*').eq('lesson_id',lessonId).eq('mux_upload_id',upload_id).single();
    checkDb(result);
    const upload = await getMuxClient().video.uploads.retrieve(upload_id);
    if (upload.status === 'waiting') await getMuxClient().video.uploads.cancel(upload_id);
    if (upload.status === 'asset_created') throw new VideoRequestError('O envio já terminou. Aguarde o processamento.',409);
    checkDb(await db.from('video_uploads').update({status:'cancelled'}).eq('id',result.data.id));
    checkDb(await db.from('video_assets').update({status:'archived',archived_at:new Date().toISOString()}).eq('id',result.data.video_asset_id));
    return Response.json({success:true},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return videoError(error); }
}
