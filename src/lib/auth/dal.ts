import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAdminSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  const { data: { session } } = await supabase.auth.getSession()
  return session!
}

export async function requireAal2() {
  const supabase = await createClient()
  
  // Use getUser() as recommended by Supabase security warnings to get fresh DB data
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/admin/login')
  }

  // Canonical way to check AAL
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (error || data.currentLevel !== 'aal2') {
    if (data?.nextLevel === 'aal2') {
      redirect('/admin/mfa/challenge')
    } else {
      redirect('/admin/mfa/enroll')
    }
  }

  // Return session for legacy compatibility with other functions
  const { data: { session } } = await supabase.auth.getSession()
  return session!
}

export async function getAdminContext() {
  const session = await requireAal2()
  const supabase = await createClient()
  const user = session.user

  // Fetch roles explicitly from the DB (do not trust client)
  const { data: roles } = await supabase
    .from('admin_user_roles')
    .select('role:admin_roles(key)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .is('expires_at', null)

  const userRoles = roles?.map(r => (r.role as any).key) || []

  return { session, user, roles: userRoles }
}

export async function requirePermission(permissionKey: string) {
  const { session } = await getAdminContext()
  
  const hasAccess = await hasPermission(permissionKey)

  if (!hasAccess) {
    redirect('/admin/unauthorized')
  }

  return session
}

export async function hasPermission(permissionKey: string) {
  const supabase = await createClient()
  const { data: hasAccess } = await supabase.rpc('has_permission', {
    required_permission: permissionKey
  })
  return !!hasAccess
}

export async function requireRecentReauthentication(maxAgeSeconds: number = 300) {
  const session = await requireAal2()
  
  // Use last_sign_in_at which reflects the actual last authentication time,
  // not updated_at which changes on any profile update
  const lastAuthTime = new Date(session.user.last_sign_in_at || session.user.created_at).getTime()
  const now = Date.now()
  
  if ((now - lastAuthTime) / 1000 > maxAgeSeconds) {
    // Need to re-auth
    redirect('/admin/login?reauth=true')
  }
}

export async function writeAdminAuditEvent({
  action,
  resourceType,
  resourceId = null,
  details = {},
  reason = null,
}: {
  action: string
  resourceType: string
  resourceId?: string | null
  details?: any
  reason?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('admin_audit_logs').insert({
    actor_id: user.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    reason,
  })
}
