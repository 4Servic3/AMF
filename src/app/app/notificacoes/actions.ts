
'use server';
import { revalidatePath } from 'next/cache';
import { listMemberNotifications, markMemberNotifications } from '@/lib/member-notifications';
export async function loadNotificationPreview(): Promise<{ items: Awaited<ReturnType<typeof listMemberNotifications>>['items'] | []; error?: string }> {
  try {
    const result = await listMemberNotifications(1);
    return { items: result.items.slice(0, 5) };
  } catch {
    return { items: [], error: 'Não foi possível carregar as notificações.' };
  }
}
export async function markNotificationPreviewRead(id: string): Promise<void> {
  await markMemberNotifications([id]);
  revalidatePath('/app/notificacoes');
  revalidatePath('/app');
}
export async function markReadAction(_state: { error?: string; success?: string }, form: FormData): Promise<{ error?: string; success?: string }> {
  try {
    await markMemberNotifications(form.getAll('notification'));
    revalidatePath('/app/notificacoes');
    return { success: 'Notificações marcadas como lidas.' };
  } catch { return { error: 'Não foi possível salvar. Atualize a página e tente novamente.' }; }
}
