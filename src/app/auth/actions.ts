'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ensureMemberProfile } from '@/lib/auth/member-profile';
import { authOrigin, RECOVERY_COOKIE, validRecoveryProof } from '@/lib/auth/recovery';
type State = { error?: string; message?: string } | null;
const emailSchema = z.email();
const passwordSchema = z.string().min(8).max(128);
export async function register(_previous: State, form: FormData): Promise<State> {
  const parsed = z.object({ email: emailSchema, password: passwordSchema, full_name: z.string().trim().min(2).max(120) }).safeParse({
    email: String(form.get('email') || '').trim().toLowerCase(), password: form.get('password'), full_name: form.get('full_name'),
  });
  if (!parsed.success) return { error: 'Preencha nome, e-mail e senha de 8 a 128 caracteres.' };
  const db = await createClient();
  const { data, error } = await db.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { full_name: parsed.data.full_name }, emailRedirectTo: authOrigin() + '/auth/callback' } });
  if (!error && data.session) await ensureMemberProfile();
  if (error && error.status && error.status >= 500) return { error: 'Cadastro temporariamente indisponível. Tente novamente.' };
  return { message: 'Se o cadastro puder ser concluído, você receberá as instruções por e-mail. Se já possui conta, entre ou recupere sua senha.' };
}
export async function recover(_previous: State, form: FormData): Promise<State> {
  const email = emailSchema.safeParse(String(form.get('email') || '').trim().toLowerCase());
  if (!email.success) return { error: 'Informe um e-mail válido.' };
  const db = await createClient();
  await db.auth.resetPasswordForEmail(email.data, { redirectTo: authOrigin() + '/auth/callback' });
  return { message: 'Se houver uma conta com este e-mail, enviaremos as instruções de recuperação. Abra o link neste mesmo navegador.' };
}
export async function resetPassword(_previous: State, form: FormData): Promise<State> {
  const password = passwordSchema.safeParse(form.get('password'));
  if (!password.success || password.data !== form.get('confirmation')) return { error: 'As senhas devem ser iguais e ter entre 8 e 128 caracteres.' };
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  const { data: { session } } = await db.auth.getSession();
  const jar = await cookies();
  if (error || !user || !session || !validRecoveryProof(jar.get(RECOVERY_COOKIE)?.value, user.id, session.access_token)) {
    return { error: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.' };
  }
  const result = await db.auth.updateUser({ password: password.data });
  if (result.error) return { error: 'Não foi possível atualizar a senha. Use uma senha diferente e tente novamente.' };
  jar.delete(RECOVERY_COOKIE);
  await db.auth.signOut();
  return { message: 'Senha atualizada. Entre novamente com sua nova senha.' };
}



