'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { generatePlaybackSessionTokens } from '@/lib/mux/client'
import { getFeatureFlags } from '@/lib/services/flags'
import { z } from 'zod'

export async function getCaseStoryPlayback(id: string): Promise<{error?:string;playbackId?:string;tokens?:{playback:string;thumbnail:string;storyboard:string};imageUrl?:string}> {
  if (!z.string().uuid().safeParse(id).success) return { error:'Story inválido.' }
  const client = await createClient()
  const { data:{user} } = await client.auth.getUser()
  if (!user) return { error:'Entre na sua conta para assistir.' }
  if (!(await getFeatureFlags()).member_cases_enabled) return { error:'Área de casos indisponível.' }
  const db = createServiceRoleClient()
  const {data:story,error} = await db.from('case_story_videos').select('mux_playback_id,duration_seconds,media_type,storage_path,cases!inner(status,visibility)').eq('id',id).eq('status','published').eq('cases.status','published').in('cases.visibility',['free','authenticated']).maybeSingle()
  if (error || !story) return { error:'Este story não está disponível.' }
  try {
    if (story.media_type === 'image') {
      const signed = await db.storage.from('case-story-images').createSignedUrl(story.storage_path,1800)
      if (signed.error) throw new Error('image_unavailable')
      return {imageUrl:signed.data.signedUrl}
    }
    if (!story.mux_playback_id) return {error:'Este vídeo não está disponível.'}
    const session = await generatePlaybackSessionTokens({playbackId:story.mux_playback_id,durationSeconds:story.duration_seconds,sessionId:crypto.randomUUID()})
    return { playbackId:story.mux_playback_id,tokens:session.tokens }
  } catch { return { error:'Não foi possível carregar o vídeo. Tente novamente.' } }
}
