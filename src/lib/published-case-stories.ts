import 'server-only'
import { storyIsRecent } from '@/lib/story-lifecycle'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getFeatureFlags } from '@/lib/services/flags'
import { getMemberAccess } from '@/lib/access/member-access'
import type { PublishedCase } from '@/components/casos/PublishedCaseStories'

// Listing and playback require a session. Without the cases product only the first story of each case is open.
type PublishedRow = { id: string; title: string; case_story_videos: { id: string; caption: string | null; created_at: string; status: string; published_at: string | null }[] }

export async function getPublishedCaseStories(homeOnly = false): Promise<PublishedCase[]> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user || !(await getFeatureFlags()).member_cases_enabled) return []
  const [caseResult, access] = await Promise.all([
    createServiceRoleClient().from('cases')
    .select('id,title,case_story_videos!inner(id,caption,created_at,status,published_at)')
    .eq('status', 'published').in('visibility', ['free', 'authenticated'])
    .eq('case_story_videos.status', 'published').order('published_at', { ascending: false }),
    getMemberAccess(),
  ])
  if (caseResult.error) throw new Error('Não foi possível carregar os casos.')
  const hasFullAccess = access.hasCasesAccess
  return (caseResult.data as PublishedRow[] || []).map(item => ({
    id: item.id, title: item.title,
    items: item.case_story_videos.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
      .map((story, index) => {
        const locked = !hasFullAccess && index > 0
        return { id: story.id, caption: locked ? '' : story.caption || '', locked, ...(homeOnly ? { publishedAt: story.published_at! } : {}) }
      })
      .filter(story => !homeOnly || storyIsRecent(story.publishedAt)),
    hasFullAccess,
  })).filter(item => item.items.length > 0)
}
