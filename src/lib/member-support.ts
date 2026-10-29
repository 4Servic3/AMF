import 'server-only';
import { z } from 'zod';
import { requireMemberAccount } from './member-account';
import { memberPage, ticketCreateSchema, ticketReplySchema, ticketStatuses } from './member-account-schema';

export type MemberTicket = { id: string; subject: string; category: string; status: keyof typeof ticketStatuses; created_at: string };
export type MemberMessage = { id: string; content: string; created_at: string; own: boolean };
const PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 30;

export async function listOwnTickets(pageInput: unknown): Promise<{ page: number; hasMore: boolean; tickets: MemberTicket[] }> {
  const { userId, db } = await requireMemberAccount();
  const page = memberPage(pageInput);
  const { data, error } = await db.from('support_tickets')
    .select('id,profile_id,subject,category,status,created_at')
    .eq('profile_id', userId).in('status', Object.keys(ticketStatuses))
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (error) throw new Error('Não foi possível carregar seus chamados.');
  const rows = (data || []).filter((row: MemberTicket & { profile_id: string }) => row.profile_id === userId && Object.hasOwn(ticketStatuses, row.status));
  return { page, hasMore: rows.length > PAGE_SIZE, tickets: rows.slice(0, PAGE_SIZE).map((row: MemberTicket): MemberTicket => ({ id: row.id, subject: row.subject, category: row.category, status: row.status, created_at: row.created_at })) };
}

export async function getOwnTicket(ticketId: string, pageInput: unknown = 1) {
  if (!z.uuid().safeParse(ticketId).success) return null;
  const { userId, db } = await requireMemberAccount();
  const { data: ticket, error } = await db.from('support_tickets')
    .select('id,profile_id,subject,category,status,created_at').eq('id', ticketId).eq('profile_id', userId).maybeSingle();
  if (error) throw new Error('Não foi possível carregar o chamado.');
  if (!ticket || ticket.profile_id !== userId || !Object.hasOwn(ticketStatuses, ticket.status)) return null;
  const page = memberPage(pageInput);
  const { data, error: messageError } = await db.from('support_messages')
    .select('id,ticket_id,sender_id,content,is_internal,created_at')
    .eq('ticket_id', ticketId).eq('is_internal', false)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * MESSAGE_PAGE_SIZE, page * MESSAGE_PAGE_SIZE);
  if (messageError) throw new Error('Não foi possível carregar as mensagens.');
  const visible = (data || []).filter((row: { ticket_id: string; is_internal: boolean }) => row.ticket_id === ticketId && row.is_internal === false);
  const messages: MemberMessage[] = visible.slice(0, MESSAGE_PAGE_SIZE).reverse().map((row: { id: string; content: string; created_at: string; sender_id: string | null }) => ({ id: row.id, content: row.content, created_at: row.created_at, own: row.sender_id === userId }));
  return { ticket: { id: ticket.id, subject: ticket.subject, category: ticket.category, status: ticket.status, created_at: ticket.created_at } as MemberTicket, messages, page, hasMore: visible.length > MESSAGE_PAGE_SIZE };
}

export async function createOwnTicket(input: unknown) {
  const values = ticketCreateSchema.parse(input);
  const { userId, db } = await requireMemberAccount();
  const { data, error } = await db.from('support_tickets')
    .insert({ profile_id: userId, subject: values.subject, category: values.category, status: 'open' }).select('id').single();
  if (error || !data) throw new Error('Não foi possível abrir o chamado. Tente novamente.');
  const { error: messageError } = await db.from('support_messages')
    .insert({ ticket_id: data.id, sender_id: userId, content: values.content, is_internal: false });
  if (messageError) {
    // Compensate the newly created empty ticket if its initial message failed.
    const { error: cleanupError } = await db.from('support_tickets').delete().eq('id', data.id).eq('profile_id', userId);
    throw new Error(cleanupError ? 'O chamado foi aberto, mas a mensagem não foi enviada. Abra o histórico e envie sua mensagem.' : 'Não foi possível abrir o chamado. Tente novamente.');
  }
  return data.id as string;
}

export async function replyOwnTicket(input: unknown) {
  const values = ticketReplySchema.parse(input);
  const { userId, db } = await requireMemberAccount();
  const { data: ticket, error } = await db.from('support_tickets').select('id,profile_id,status')
    .eq('id', values.ticketId).eq('profile_id', userId).maybeSingle();
  if (error || !ticket || ticket.profile_id !== userId || !['open', 'pending'].includes(ticket.status)) {
    throw new Error('Este chamado não está disponível para resposta.');
  }
  const { error: insertError } = await db.from('support_messages')
    .insert({ ticket_id: values.ticketId, sender_id: userId, content: values.content, is_internal: false });
  if (insertError) throw new Error('Não foi possível enviar sua mensagem. Tente novamente.');
}

/** Conversa em andamento mais recente (aberta ou em atendimento), para o botão flutuante de suporte. */
export async function getActiveConversation() {
  const { userId, db } = await requireMemberAccount();
  const { data, error } = await db.from('support_tickets').select('id,profile_id,status')
    .eq('profile_id', userId).in('status', ['open', 'pending'])
    .order('created_at', { ascending: false }).limit(1);
  if (error) throw new Error('Não foi possível carregar o suporte.');
  const latest = (data || []).find((row: { profile_id: string }) => row.profile_id === userId) as { id: string } | undefined;
  return latest ? getOwnTicket(latest.id) : null;
}
