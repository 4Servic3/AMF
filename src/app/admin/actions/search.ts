'use server'

import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/auth/dal'

export type SearchResultItem = {
  id: string
  title: string
  subtitle?: string
  type: 'user' | 'case' | 'course'
  href: string
}

export type GlobalSearchResult = {
  users: SearchResultItem[]
  cases: SearchResultItem[]
  courses: SearchResultItem[]
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const supabase = await createClient()
  const results: GlobalSearchResult = {
    users: [],
    cases: [],
    courses: []
  }

  if (!query || query.trim().length < 2) return results

  const q = `%${query.trim()}%`

  const canManageUsers = await hasPermission('users.manage')
  if (canManageUsers) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`)
      .limit(5)
    
    if (usersData) {
      results.users = usersData.map(u => ({
        id: u.id,
        title: `${u.first_name} ${u.last_name}`,
        subtitle: u.email,
        type: 'user',
        href: `/admin/users/${u.id}`
      }))
    }
  }

  const canManageCases = await hasPermission('content.manage') || await hasPermission('cases.manage')
  if (canManageCases) {
    const { data: casesData } = await supabase
      .from('cases')
      .select('id, title, status')
      .ilike('title', q)
      .limit(5)
      
    if (casesData) {
      results.cases = casesData.map(c => ({
        id: c.id,
        title: c.title,
        subtitle: c.status,
        type: 'case',
        href: `/admin/cases/${c.id}`
      }))
    }
  }

  const canManageCourses = await hasPermission('content.manage') || await hasPermission('courses.manage')
  if (canManageCourses) {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title, status')
      .ilike('title', q)
      .limit(5)
      
    if (coursesData) {
      results.courses = coursesData.map(c => ({
        id: c.id,
        title: c.title,
        subtitle: c.status,
        type: 'course',
        href: `/admin/courses/${c.id}`
      }))
    }
  }

  return results
}
