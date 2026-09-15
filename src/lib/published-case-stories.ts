import 'server-only'
import { storyIsRecent } from '@/lib/story-lifecycle'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getFeatureFlags } from '@/lib/services/flags'
import type { PublishedCase } from '@/components/casos/PublishedCaseStories'

// Both listing and playback require a session. Purchases are intentionally not required.
type PublishedRow = { id: string; title: string; case_story_videos: { id: string; caption: string | null; created_at: string; status: string; published_at: string | null }[] }

export async function getPublishedCaseStories(homeOnly = false): Promise<PublishedCase[]> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user || !(await getFeatureFlags()).member_cases_enabled) return []
  const { data, error } = await createServiceRoleClient().from('cases')
    .select('id,title,case_story_videos!inner(id,caption,created_at,status,published_at)')
    .eq('status', 'published').in('visibility', ['free', 'authenticated'])
    .eq('case_story_videos.status', 'published').order('published_at', { ascending: false })
  if (error) throw new Error('Não foi possível carregar os casos.')
  return (data as PublishedRow[] || []).map(item => ({
    id: item.id, title: item.title,
    items: item.case_story_videos.filter(story => !homeOnly || storyIsRecent(story.published_at)).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
      .map(story => ({ id: story.id, caption: story.caption || '', ...(homeOnly ? { publishedAt: story.published_at! } : {}) }))
  })).filter(item => item.items.length > 0)
}
