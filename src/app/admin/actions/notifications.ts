'use server'

import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/auth/dal'

export type AdminNotification = {
  id: string
  title: string
  description: string
  href: string
  createdAt: string
  read: boolean
}

export async function getAdminNotifications(): Promise<{ count: number, notifications: AdminNotification[] }> {
  const supabase = await createClient()
  const canManageCases = await hasPermission('content.manage') || await hasPermission('cases.manage')
  const canManageSupport = await hasPermission('support.manage')
  
  let notifications: AdminNotification[] = []
  
  if (canManageCases) {
    const { count } = await supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'pending_review')
    if (count && count > 0) {
      notifications.push({
        id: 'pending-cases',
        title: 'Casos pendentes',
        description: `${count} casos aguardam revisão.`,
        href: '/admin/cases?status=pending_review',
        createdAt: new Date().toISOString(),
        read: false
      })
    }
  }
  
  if (canManageSupport) {
    const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
    if (count && count > 0) {
      notifications.push({
        id: 'open-tickets',
        title: 'Tickets abertos',
        description: `${count} tickets de suporte abertos.`,
        href: '/admin/support?status=open',
        createdAt: new Date().toISOString(),
        read: false
      })
    }
  }
  
  return {
    count: notifications.filter(n => !n.read).length,
    notifications
  }
}
