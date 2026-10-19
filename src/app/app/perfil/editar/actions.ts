'use server';
import { revalidatePath } from 'next/cache';
import { saveOwnProfile } from '@/lib/member-account';
import { profileEditSchema, type MemberActionState } from '@/lib/member-account-schema';
export async function saveProfileAction(_state: MemberActionState, form: FormData): Promise<MemberActionState> {
  const parsed = profileEditSchema.safeParse({ full_name: form.get('full_name'), display_name: form.get('display_name'), phone: form.get('phone'), profession: form.get('profession') });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try { await saveOwnProfile(parsed.data); }
  catch (error) { return { error: error instanceof Error ? error.message : 'Não foi possível salvar seu perfil.' }; }
  revalidatePath('/app/perfil');
  revalidatePath('/app/perfil/editar');
  revalidatePath('/app');
  return { success: 'Perfil atualizado.' };
}
