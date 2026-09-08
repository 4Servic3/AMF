import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { requireVideoAdmin, videoError, checkDb, VideoRequestError } from '@/lib/mux/admin';
import { getMuxClient } from '@/lib/mux/client';
import { syncVideo } from '@/lib/mux/sync';
export async function GET(req: Request) {
  try {
    await requireVideoAdmin(req);
    const page = Math.max(1,Math.min(10000,Number(new URL(req.url).searchParams.get('page')) || 1));
    const list = await getMuxClient().video.assets.list({limit:20,page});
    return Response.json({videos:list.data.map(a=>({id:a.id,title:a.meta?.title || 'Vídeo de '+new Date(Number(a.created_at)*1000).toLocaleDateString('pt-BR'),duration_seconds:Math.round(a.duration || 0),status:a.status})),hasMore:list.data.length===20},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return videoError(error); }
}
export async function POST(req: Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    const user = await requireVideoAdmin(req);
    const {lessonId} = await params;
    const {mux_asset_id} = await req.json();
    if (typeof mux_asset_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(mux_asset_id)) throw new VideoRequestError('Vídeo inválido.');
    const db = createServiceRoleClient();
    const lesson = await db.from('lessons').select('id').eq('id',lessonId).single();
    checkDb(lesson);
    const remote = await getMuxClient().video.assets.retrieve(mux_asset_id);
    if (remote.status !== 'ready') throw new VideoRequestError('Este vídeo ainda não está pronto.',409);
    const existing = await db.from('video_assets').select('id').eq('mux_asset_id',mux_asset_id).maybeSingle();
    checkDb(existing);
    let videoId = existing.data?.id;
    if (!videoId) {
      const saved = await db.from('video_assets').insert({provider:'mux',provider_asset_id:mux_asset_id,mux_asset_id,status:'processing',playback_policy:'signed',created_by:user.id,title:remote.meta?.title || null}).select('id').single();
      checkDb(saved);
      videoId=saved.data.id;
    }
    await syncVideo(videoId);
    return Response.json({video_asset_id:videoId},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return videoError(error); }
}

