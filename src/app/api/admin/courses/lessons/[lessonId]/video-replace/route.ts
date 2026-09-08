import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { requireVideoAdmin, videoError, checkDb, VideoRequestError } from '@/lib/mux/admin';
import { revalidatePath } from 'next/cache';
export async function POST(req: Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    const user = await requireVideoAdmin(req);
    const {lessonId} = await params;
    const {new_video_asset_id,reason} = await req.json();
    if (typeof new_video_asset_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(new_video_asset_id)) throw new VideoRequestError('Selecione um vídeo pronto.');
    const db = createServiceRoleClient();
    const result = await db.rpc('activate_lesson_video',{p_lesson_id:lessonId,p_video_id:new_video_asset_id,p_actor_id:user.id,p_reason:typeof reason === 'string' ? reason.slice(0,500) : 'Publicação de vídeo'});
    if (result.error?.message?.includes('video_not_ready')) throw new VideoRequestError('Aguarde o vídeo ficar pronto antes de publicar.',409);
    checkDb(result);
    revalidatePath('/app/cursos','layout');
    revalidatePath('/admin/courses','layout');
    return Response.json({success:true},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return videoError(error); }
}

