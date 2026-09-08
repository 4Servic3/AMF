import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { requireVideoAdmin, videoError, checkDb, VideoRequestError } from '@/lib/mux/admin';
import { syncVideo } from '@/lib/mux/sync';
export async function GET(req: Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    await requireVideoAdmin(req);
    const {lessonId} = await params;
    const db = createServiceRoleClient();
    const lesson = await db.from('lessons').select('id,title,video_asset_id').eq('id',lessonId).maybeSingle();
    checkDb(lesson);
    if (!lesson.data) throw new VideoRequestError('Aula não encontrada.',404);
    const [video,uploads,history] = await Promise.all([
      lesson.data.video_asset_id ? db.from('video_assets').select('*').eq('id',lesson.data.video_asset_id).maybeSingle() : {data:null,error:null},
      db.from('video_uploads').select('*,video_assets(*)').eq('lesson_id',lessonId).neq('status','cancelled').order('created_at',{ascending:false}).limit(1).maybeSingle(),
      db.from('lesson_videos').select('video_asset_id,video_assets(id,title,status,duration_seconds)').eq('lesson_id',lessonId).eq('is_primary',false),
    ]);
    [video,uploads,history].forEach(checkDb);
    return Response.json({video:video.data,upload:uploads.data,history:history.data},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return videoError(error); }
}
export async function POST(req: Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    await requireVideoAdmin(req);
    const {lessonId} = await params;
    const db = createServiceRoleClient();
    const upload = await db.from('video_uploads').select('video_asset_id').eq('lesson_id',lessonId).neq('status','cancelled').order('created_at',{ascending:false}).limit(1).maybeSingle();
    checkDb(upload);
    if (upload.data?.video_asset_id) await syncVideo(upload.data.video_asset_id);
    return Response.json({success:true},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return videoError(error); }
}

