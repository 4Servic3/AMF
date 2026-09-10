import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { requireVideoAdmin, checkDb, videoError, VideoRequestError } from '@/lib/mux/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const input = z.object({name:z.string().trim().min(1).max(200),size:z.number().int().positive().max(50*1024*1024),mime:z.string().max(200)});
const json=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    await requireVideoAdmin(req);
    const {lessonId}=await params;
    const result=await createServiceRoleClient().from('lesson_materials').select('id,name,title,size_bytes,status').eq('lesson_id',lessonId).eq('status','published').order('created_at');
    checkDb(result); return json({materials:result.data});
  } catch(e) {return videoError(e);}
}
export async function POST(req:Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    await requireVideoAdmin(req);
    const {lessonId}=await params;
    const parsed=input.safeParse(await req.json());
    if(!parsed.success) throw new VideoRequestError('Escolha um arquivo de até 50 MB com nome válido.');
    const {name,size,mime}=parsed.data;
    const db=createServiceRoleClient();
    const lesson=await db.from('lessons').select('id,course_modules!inner(course_id)').eq('id',lessonId).single();
    checkDb(lesson);
    const module=lesson.data.course_modules as unknown as {course_id:string};
    const id=crypto.randomUUID();
    const path=module.course_id+'/'+lessonId+'/'+id;
    const signed=await db.storage.from('lesson-files').createSignedUploadUrl(path,{upsert:false});
    checkDb(signed);
    const inserted=await db.from('lesson_materials').insert({id,lesson_id:lessonId,course_id:module.course_id,title:name,name,file_url:path,storage_path:path,bucket_name:'lesson-files',type:mime==='application/pdf'?'pdf':'file',mime_type:mime||'application/octet-stream',size_bytes:size,status:'draft',download_policy:'download'});
    checkDb(inserted);
    return json({id,path,token:signed.data!.token});
  } catch(e) {return videoError(e);}
}
export async function PATCH(req:Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    await requireVideoAdmin(req);
    const {lessonId}=await params;
    const body=await req.json();
    const id=z.string().uuid().safeParse(body.id);
    if(!id.success) throw new VideoRequestError('Arquivo inválido.');
    const result=await createServiceRoleClient().rpc('finish_lesson_material',{p_material:id.data,p_lesson:lessonId});
    if(result.error?.message.includes('upload_incomplete')) throw new VideoRequestError('O envio não terminou. Tente novamente.',409);
    checkDb(result);
    revalidatePath('/admin/courses','layout'); revalidatePath('/app/cursos','layout');
    return json({success:true});
  } catch(e) {return videoError(e);}
}
export async function DELETE(req:Request,{params}:{params:Promise<{lessonId:string}>}) {
  try {
    await requireVideoAdmin(req);
    const {lessonId}=await params;
    const {id}=await req.json();
    if(!z.string().uuid().safeParse(id).success) throw new VideoRequestError('Arquivo inválido.');
    checkDb(await createServiceRoleClient().from('lesson_materials').update({status:'archived'}).eq('id',id).eq('lesson_id',lessonId));
    revalidatePath('/app/cursos','layout');
    return json({success:true});
  } catch(e) {return videoError(e);}
}
