import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { profileEditSchema, type ProfileEdit } from './member-account-schema';

export async function requireMemberAccount() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('Entre novamente para continuar.');
  return { userId: user.id, db: createServiceRoleClient() };
}
export async function getOwnProfile(): Promise<ProfileEdit> {
  const { userId, db } = await requireMemberAccount();
  const { data, error } = await db.from('profiles').select('full_name,display_name,phone,profession').eq('id', userId).maybeSingle();
  if (error || !data) throw new Error('Não foi possível carregar seu perfil.');
  return { full_name: data.full_name || '', display_name: data.display_name || '', phone: data.phone || '', profession: ['veterinarian', 'student', 'other'].includes(data.profession) ? data.profession : 'other' };
}
export async function saveOwnProfile(input: unknown) {
  const fields = profileEditSchema.parse(input);
  const { userId, db } = await requireMemberAccount();
  const { data, error } = await db.from('profiles').update(fields).eq('id', userId).select('id').maybeSingle();
  if (error || !data || data.id !== userId) throw new Error('Não foi possível salvar seu perfil. Tente novamente.');
}
