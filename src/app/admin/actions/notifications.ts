'use server'

import { hasPermission } from '@/lib/auth/dal'
import { adminDb } from '@/lib/admin-data'
import { ACTIVE_TICKET_STATUSES, awaitingReply, type InboxItem, type InboxTicket } from '@/lib/admin/support-inbox'

export type AdminNotification = {
  id: string
  title: string
  description: string
  href: string
  createdAt: string
  read: boolean
}

/** Chamados que esperam a equipe, do mais recente para o mais antigo. */
export async function loadSupportInbox(): Promise<InboxItem[]> {
  const db = await adminDb('support.manage')
  const { data, error } = await db
    .from('support_tickets')
    .select('id,subject,status,created_at,profile_id,profiles!profile_id(full_name,email),support_messages(sender_id,is_internal,created_at)')
    .in('status', ACTIVE_TICKET_STATUSES)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    console.error('Support inbox query failed', error)
    return []
  }
  return awaitingReply((data || []) as unknown as InboxTicket[])
}

export async function getAdminNotifications(): Promise<{ count: number, notifications: AdminNotification[] }> {
  if (!(await hasPermission('support.manage'))) return { count: 0, notifications: [] }
  const inbox = await loadSupportInbox()
  const notifications = inbox.slice(0, 8).map((t) => ({
    id: t.id,
    title: t.isNew ? 'Novo chamado de suporte' : 'Nova mensagem no suporte',
    description: `${t.student}: ${t.subject}`,
    href: `/admin/support/${t.id}`,
    createdAt: t.at,
    read: false,
  }))
  return { count: inbox.length, notifications }
}
