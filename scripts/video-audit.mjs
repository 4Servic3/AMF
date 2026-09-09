import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
nextEnv.loadEnvConfig(process.cwd());
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const [table, columns] of [
  ['courses','id,title,slug,status'],
  ['course_modules','id,course_id,title,status'],
  ['lessons','id,module_id,title,slug,status,video_asset_id'],
  ['video_assets','id,provider_asset_id,mux_asset_id,mux_playback_id,status,duration_seconds'],
  ['lesson_videos','lesson_id,video_asset_id,is_primary'],
  ['video_uploads','id,lesson_id,video_asset_id,status'],
  ['webhook_events','id,provider,type,status,processing_status'],
]) {
  const {data,error} = await db.from(table).select(columns).limit(30);
  console.log(JSON.stringify({table,data,error:error ? {code:error.code,message:error.message} : null}));
}
try {
  const mux = new Mux({tokenId:process.env.MUX_TOKEN_ID,tokenSecret:process.env.MUX_TOKEN_SECRET});
  const assets = await mux.video.assets.list({limit:10});
  const uploads = await mux.video.uploads.list({limit:3});
  console.log(JSON.stringify({recentUploads:uploads.data.map(u=>({id:u.id,status:u.status,cors_origin:u.cors_origin,destination:u.url?new URL(u.url).origin:null}))}));
  console.log(JSON.stringify({mux:assets.data.map(a=>({id:a.id,status:a.status,duration:a.duration,playback_ids:a.playback_ids}))}));
  for (const asset of assets.data) {
    const playback = asset.playback_ids?.find(p=>p.policy==='signed');
    if (!playback) continue;
    try {
      const token=await mux.jwt.signPlaybackId(playback.id,{keyId:process.env.MUX_SIGNING_KEY_ID,keySecret:process.env.MUX_PRIVATE_KEY,type:'video',expiration:'5m'});
      const response=await fetch('https://stream.mux.com/'+playback.id+'.m3u8?token='+encodeURIComponent(token));
      console.log(JSON.stringify({playbackAsset:asset.id,status:response.status,validManifest:(await response.text()).startsWith('#EXTM3U')}));
    } catch {console.log(JSON.stringify({playbackAsset:asset.id,error:'signing_or_stream_failed'}));}
  }
} catch(e) { console.log(JSON.stringify({muxError:e.status || 'connection_failed'})); }
const publicSite = await fetch('https://amf-eight.vercel.app/');
console.log(JSON.stringify({siteStatus:publicSite.status,csp:publicSite.headers.get('content-security-policy')}));
