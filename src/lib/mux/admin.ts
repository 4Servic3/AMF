import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { validateRequestOrigin } from './origins';

export class VideoRequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function requireVideoAdmin(req: Request) {
  if (!validateRequestOrigin(req).allowed) throw new VideoRequestError('Origem não autorizada.', 403);
  const db = await createClient();
  const {data: {user},error} = await db.auth.getUser();
  if (error || !user) throw new VideoRequestError('Entre novamente na sua conta.',401);
  const {data: mfa} = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfa?.currentLevel !== 'aal2') throw new VideoRequestError('Confirme a autenticação em duas etapas.',403);
  const permissions = await Promise.all(['courses.videos.manage','content.manage'].map(required_permission =>
    db.rpc('has_permission',{required_permission})));
  if (!permissions.some(p => !p.error && p.data)) throw new VideoRequestError('Sem permissão para gerenciar vídeos.',403);
  return user;
}

export function videoError(error: unknown) {
  const id = crypto.randomUUID();
  if (!(error instanceof VideoRequestError)) console.error('video_operation_failed', {id});
  return Response.json({error:error instanceof VideoRequestError ? error.message : 'Não foi possível concluir. Tente novamente.',correlation_id:id},
    {status:error instanceof VideoRequestError ? error.status : 503,headers:{'Cache-Control':'no-store'}});
}

export function checkDb(result: {error: {code?: string;message?: string} | null}) {
  if (result.error) throw new Error(`video_database_error:${result.error.code || 'unknown'}`);
}
