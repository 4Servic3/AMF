import 'server-only';
import { z } from 'zod';
import { requireMemberAccount } from './member-account';
import { memberPage } from './member-account-schema';
export function safeNotificationLink(value: string | null): string | null {
  if (!value || /[\\\x00-\x20]/.test(value) || !/^\/app(?:\/|$|\?)/.test(value)) return null;
  return value;
}
type Notice = { id: string; title: string; message: string; target_url: string | null; created_at: string; read: boolean };
export async function listMemberNotifications(input: unknown): Promise<{ items: Notice[]; page: number; hasMore: boolean }> {
  const { userId, db } = await requireMemberAccount();
  const page = memberPage(input);
  const { data, error } = await db.from('notifications').select('id,title,message,target_url,created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  if (error) throw new Error('Não foi possível carregar as notificações.');
  const rows = ((data || []) as Omit<Notice, 'read'>[]).slice(0, 20);
  if (!rows.length) return { items: [], page, hasMore: false };
  const reads = await db.from('notification_reads').select('notification_id').eq('profile_id', userId).in('notification_id', rows.map(row => row.id));
  if (reads.error) throw new Error('Não foi possível carregar as leituras.');
  const readIds = new Set(((reads.data || []) as { notification_id: string }[]).map(row => row.notification_id));
  return { page, hasMore: (data || []).length > 20, items: rows.map(row => ({ ...row, target_url: safeNotificationLink(row.target_url), read: readIds.has(row.id) })) };
}
export async function markMemberNotifications(input: unknown) {
  const ids = [...new Set(z.array(z.uuid()).min(1).max(20).parse(input))];
  const { userId, db } = await requireMemberAccount();
  const existing = await db.from('notifications').select('id').in('id', ids);
  if (existing.error) throw new Error('Não foi possível consultar as notificações.');
  const valid = ((existing.data || []) as { id: string }[]).filter(row => ids.includes(row.id));
  if (!valid.length) return;
  const result = await db.from('notification_reads').upsert(valid.map(row => ({ profile_id: userId, notification_id: row.id })), { onConflict: 'profile_id,notification_id', ignoreDuplicates: true });
  if (result.error) throw new Error('Não foi possível marcar as notificações.');
}
