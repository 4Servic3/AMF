import 'server-only';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getMuxClient, ensureSignedPlaybackId } from './client';
import { checkDb } from './admin';

// Shared by webhook deliveries and the administrator's explicit reconciliation.
export async function syncVideo(videoId: string) {
  const db = createServiceRoleClient();
  const result = await db.from('video_assets').select('*').eq('id',videoId).single();
  checkDb(result);
  const local = result.data;
  if (local.status === 'archived' || local.deleted_at) return local;
  const mux = getMuxClient();
  let assetId = local.mux_asset_id;
  if (!assetId && local.mux_upload_id) {
    const upload = await mux.video.uploads.retrieve(local.mux_upload_id);
    assetId = upload.asset_id;
    if (!assetId) {
      if (['cancelled','errored','timed_out'].includes(upload.status)) {
        checkDb(await db.from('video_uploads').update({status:upload.status === 'cancelled' ? 'cancelled':'errored'}).eq('mux_upload_id',local.mux_upload_id));
        checkDb(await db.from('video_assets').update({status:'errored',error_message:'Envio interrompido ou expirado. Envie o arquivo novamente.'}).eq('id',videoId));
      }
      return local;
    }
  }
  if (!assetId) return local;
  const asset = await mux.video.assets.retrieve(assetId);
  const ready = asset.status === 'ready';
  const playbackId = ready ? await ensureSignedPlaybackId(assetId) : null;
  const values = {
    mux_asset_id:assetId,provider_asset_id:assetId,
    ...(playbackId ? {mux_playback_id:playbackId,playback_id:playbackId} : {}),
    playback_policy:'signed',status:ready ? 'ready' : asset.status === 'errored' ? 'errored':'processing',
    duration_seconds:asset.duration ? Math.round(asset.duration):null,
    aspect_ratio:asset.aspect_ratio || null,max_stored_resolution:asset.max_stored_resolution || null,
    error_message:asset.status === 'errored' ? 'Não foi possível processar este arquivo. Tente outro vídeo.':null,
    ...(ready ? {ready_at:new Date().toISOString()} : {}),updated_at:new Date().toISOString(),
  };
  // A deletion/cancellation wins over a concurrent ready notification.
  checkDb(await db.from('video_assets').update(values).eq('id',videoId).neq('status','archived'));
  if (local.mux_upload_id) checkDb(await db.from('video_uploads').update({status:asset.status === 'errored' ? 'errored':'asset_created'}).eq('mux_upload_id',local.mux_upload_id).neq('status','cancelled'));
  if (ready && local.mux_upload_id) checkDb(await db.rpc('activate_uploaded_video',{p_video:videoId}));
  return {...local,...values};
}
