'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { readPreferences } from '@/lib/member-preferences';
type State = { error?: string; message?: string } | null;
export async function changeMemberPassword(_state: State, form: FormData): Promise<State> {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user?.email) return { error: 'Entre novamente para continuar.' };
  const values = z.object({ current: z.string().min(1).max(128), password: z.string().min(8).max(128), confirmation: z.string() }).safeParse(Object.fromEntries(form));
  if (!values.success || values.data.password !== values.data.confirmation) return { error: 'Confira a senha atual e repita a nova senha, de 8 a 128 caracteres.' };
  const verified = await db.auth.signInWithPassword({ email: user.email, password: values.data.current });
  if (verified.error || verified.data.user?.id !== user.id) return { error: 'Senha atual incorreta. Tente novamente.' };
  const changed = await db.auth.updateUser({ password: values.data.password });
  if (changed.error) return { error: 'Não foi possível alterar a senha. Use uma senha diferente e tente novamente.' };
  const ended = await db.auth.signOut({ scope: 'others' });
  return { message: ended.error ? 'Senha alterada, mas não foi possível encerrar as outras sessões. Tente novamente abaixo.' : 'Senha alterada e outras sessões desconectadas. Tokens já emitidos podem permanecer válidos até expirarem.' };
}
export async function signOutOtherSessions(_state: State, _form: FormData): Promise<State> {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { error: 'Entre novamente para continuar.' };
  const result = await db.auth.signOut({ scope: 'others' });
  return result.error ? { error: 'Não foi possível encerrar as outras sessões.' } : { message: 'Outras sessões desconectadas. Tokens já emitidos podem permanecer válidos até expirarem.' };
}
async function savePreferences(form: FormData, kind: 'notifications' | 'accessibility'): Promise<State> {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { error: 'Entre novamente para continuar.' };
  const admin = createServiceRoleClient();
  const existing = await admin.from('profiles').select('communication_preferences').eq('id', user.id).single();
  if (existing.error || !existing.data) return { error: 'Não foi possível carregar suas preferências.' };
  const raw = existing.data.communication_preferences;
  const previous = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const preferences = readPreferences(previous);
  const fields = kind === 'notifications' ? ['email_notifications'] : ['reduce_motion', 'large_text'];
  if (fields.some(field => form.has(field) && form.get(field) !== 'on')) return { error: 'Preferências inválidas.' };
  const next = kind === 'notifications' ? { ...previous, email_notifications: form.get('email_notifications') === 'on' } : { ...previous, accessibility: { ...preferences.accessibility, reduce_motion: form.get('reduce_motion') === 'on', large_text: form.get('large_text') === 'on' } };
  const result = await admin.from('profiles').update({ communication_preferences: next }).eq('id', user.id);
  if (result.error) return { error: 'Não foi possível salvar. Tente novamente.' };
  revalidatePath('/app', 'layout');
  return { message: 'Preferências salvas.' };
}
export async function saveNotificationPreferences(_state: State, form: FormData) { return savePreferences(form, 'notifications'); }
export async function saveAccessibilityPreferences(_state: State, form: FormData) { return savePreferences(form, 'accessibility'); }

