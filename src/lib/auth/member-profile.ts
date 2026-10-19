import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
/** Auth validates identity; metadata may supply a name, never roles or entitlements. */
export async function ensureMemberProfile() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user || !user.email) throw new Error('Entre novamente para continuar.');
  const providedName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim().slice(0, 120) : '';
  const { error: profileError } = await createServiceRoleClient().from('profiles').upsert({
    id: user.id, email: user.email, full_name: providedName || 'Aluno AMF',
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileError) throw new Error('Não foi possível preparar seu perfil. Tente entrar novamente.');
}

