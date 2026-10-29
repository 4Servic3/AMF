import 'server-only';
import { z } from 'zod';
import { requireMemberAccount } from './member-account';
import { memberPage } from './member-account-schema';
export function safeNotificationLink(value: string | null): string | null {
  if (!value || /[\\\x00-\x20]/.test(value) || !/^\/app(?:\/|$|\?)/.test(value)) return null;
  return value;
}
type Notice = { id: string; title: string; message: string; target_url: string | null; created_at: string; read: boolean };
type Db = Awaited<ReturnType<typeof requireMemberAccount>>['db'];

/** Coluna profile_id ainda não criada no banco: só existem avisos para todos. */
const missingColumn = (error: { code?: string } | null) => error?.code === '42703';
/** Avisos para todos (sem profile_id) e os avisos pessoais deste aluno. */
const visibleTo = (userId: string) => `profile_id.is.null,profile_id.eq.${userId}`;

export async function listMemberNotifications(input: unknown): Promise<{ items: Notice[]; page: number; hasMore: boolean }> {
  const { userId, db } = await requireMemberAccount();
  const page = memberPage(input);
  const query = () => db.from('notifications').select('id,title,message,target_url,created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  let { data, error } = await query().or(visibleTo(userId));
  if (missingColumn(error)) ({ data, error } = await query());
  if (error) throw new Error('Não foi possível carregar as notificações.');
  const rows = ((data || []) as Omit<Notice, 'read'>[]).slice(0, 20);
  if (!rows.length) return { items: [], page, hasMore: false };
  const reads = await db.from('notification_reads').select('notification_id').eq('profile_id', userId).in('notification_id', rows.map(row => row.id));
  if (reads.error) throw new Error('Não foi possível carregar as leituras.');
  const readIds = new Set(((reads.data || []) as { notification_id: string }[]).map(row => row.notification_id));
  return { page, hasMore: (data || []).length > 20, items: rows.map(row => ({ ...row, target_url: safeNotificationLink(row.target_url), read: readIds.has(row.id) })) };
}

async function markRead(db: Db, userId: string, ids: string[]) {
  if (!ids.length) return;
  const result = await db.from('notification_reads').upsert(ids.map(id => ({ profile_id: userId, notification_id: id })), { onConflict: 'profile_id,notification_id', ignoreDuplicates: true });
  if (result.error) throw new Error('Não foi possível marcar as notificações.');
}

export async function markMemberNotifications(input: unknown) {
  const ids = [...new Set(z.array(z.uuid()).min(1).max(20).parse(input))];
  const { userId, db } = await requireMemberAccount();
  let existing = await db.from('notifications').select('id').in('id', ids).or(visibleTo(userId));
  if (missingColumn(existing.error)) existing = await db.from('notifications').select('id').in('id', ids);
  if (existing.error) throw new Error('Não foi possível consultar as notificações.');
  await markRead(db, userId, ((existing.data || []) as { id: string }[]).filter(row => ids.includes(row.id)).map(row => row.id));
}

/** Ao abrir a conversa, os avisos de resposta daquele chamado contam como lidos. */
export async function markSupportNoticesRead(ticketId: string) {
  if (!z.uuid().safeParse(ticketId).success) return;
  const { userId, db } = await requireMemberAccount();
  const { data, error } = await db.from('notifications').select('id').eq('profile_id', userId).eq('target_url', `/app/perfil/suporte/${ticketId}`).limit(50);
  if (error) return;
  await markRead(db, userId, ((data || []) as { id: string }[]).map(row => row.id)).catch(() => undefined);
}
