'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createOwnTicket, replyOwnTicket } from '@/lib/member-support';
import { ticketCreateSchema, ticketReplySchema, type MemberActionState } from '@/lib/member-account-schema';

export async function createTicketAction(_state: MemberActionState, form: FormData): Promise<MemberActionState> {
  const values = ticketCreateSchema.safeParse({ subject: form.get('subject'), category: form.get('category'), content: form.get('content') });
  if (!values.success) return { error: values.error.issues[0].message };
  let ticketId: string;
  try { ticketId = await createOwnTicket(values.data); }
  catch (error) { return { error: error instanceof Error ? error.message : 'Não foi possível abrir o chamado.' }; }
  revalidatePath('/app/perfil/suporte');
  revalidatePath('/admin/support');
  redirect(`/app/perfil/suporte/${ticketId}`);
}
export async function replyTicketAction(_state: MemberActionState, form: FormData): Promise<MemberActionState> {
  const values = ticketReplySchema.safeParse({ ticketId: form.get('ticketId'), content: form.get('content') });
  if (!values.success) return { error: 'Informe uma mensagem de até 5.000 caracteres.' };
  try { await replyOwnTicket(values.data); }
  catch (error) { return { error: error instanceof Error ? error.message : 'Não foi possível enviar sua mensagem.' }; }
  revalidatePath(`/app/perfil/suporte/${values.data.ticketId}`);
  revalidatePath(`/admin/support/${values.data.ticketId}`);
  return { success: 'Mensagem enviada.' };
}
