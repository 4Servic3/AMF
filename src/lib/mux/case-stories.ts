import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getMuxClient } from './client'

export async function syncCaseStory(id: string): Promise<string> {
  const db = createServiceRoleClient()
  const { data: story, error } = await db.from('case_story_videos').select('id,mux_upload_id,status,media_type').eq('id',id).single()
  if (error || !story) throw new Error('story_missing')
  if (story.status !== 'processing') return story.status
  if (story.media_type === 'image') {
    const result = await db.rpc('publish_case_story_image',{p_story:id})
    if (result.error?.message.includes('upload_incomplete')) return 'processing'
    if (result.error) throw new Error('publish_failed')
    return 'published'
  }
  const mux = getMuxClient()
  const upload = await mux.video.uploads.retrieve(story.mux_upload_id)
  if (['errored','cancelled','timed_out'].includes(upload.status)) {
    const result = await db.from('case_story_videos').update({status:'error'}).eq('id',id).eq('status','processing')
    if (result.error) throw new Error('save_failed')
    return 'error'
  }
  if (!upload.asset_id) return 'processing'
  const asset = await mux.video.assets.retrieve(upload.asset_id)
  if (asset.status === 'errored') {
    const result = await db.from('case_story_videos').update({status:'error'}).eq('id',id).eq('status','processing')
    if (result.error) throw new Error('save_failed')
    return 'error'
  }
  if (asset.status !== 'ready') return 'processing'
  const playback = asset.playback_ids?.find(p => p.policy === 'signed')?.id
  if (!playback) throw new Error('signed_playback_missing')
  const result = await db.rpc('publish_case_story', { p_story:id, p_asset:asset.id, p_playback:playback, p_duration:Math.ceil(asset.duration || 0) })
  if (result.error) throw new Error('publish_failed')
  return 'published'
}
