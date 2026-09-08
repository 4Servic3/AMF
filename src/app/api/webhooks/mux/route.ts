import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { verifyWebhookSignature, recordWebhookMetric } from '@/lib/mux';
import { syncVideo } from '@/lib/mux/sync';
import { checkDb } from '@/lib/mux/admin';

export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();
  let storedId: string | undefined;
  let db: ReturnType<typeof createServiceRoleClient> | undefined;
  try {
    const raw = await req.text();
    const signature = await verifyWebhookSignature(raw,req.headers);
    if (!signature.valid) return Response.json({error:'Assinatura inválida.'},{status:401});
    let event;
    try { event = JSON.parse(raw); } catch { return Response.json({error:'JSON inválido.'},{status:400}); }
    if (typeof event.id !== 'string' || typeof event.type !== 'string') return Response.json({error:'Evento incompleto.'},{status:400});
    db = createServiceRoleClient();
    const saved = await db.from('webhook_events').insert({provider:'mux',provider_event_id:event.id,external_id:event.id,type:event.type,payload:event,processing_status:'received',status:'pending'}).select('id').single();
    if (saved.error) {
      if (saved.error.code !== '23505') throw new Error('event_insert_failed');
      const previous = await db.from('webhook_events').select('id,processing_status').eq('provider','mux').eq('provider_event_id',event.id).single();
      checkDb(previous);
      if (previous.data.processing_status === 'processed') {
        recordWebhookMetric('duplicates');
        return Response.json({received:true});
      }
      storedId=previous.data.id; // Retry an interrupted or failed delivery.
    } else storedId=saved.data.id;
    const data=event.data || {};
    const byUpload = event.type.startsWith('video.upload.');
    if (byUpload || ['video.asset.ready','video.asset.errored','video.asset.deleted'].includes(event.type)) {
      const lookup = db.from('video_assets').select('id,status');
      const found = data.passthrough && /^[0-9a-f-]{36}$/i.test(data.passthrough)
        ? await lookup.eq('id',data.passthrough).maybeSingle()
        : await lookup.eq(byUpload ? 'mux_upload_id':'mux_asset_id',data.id).maybeSingle();
      checkDb(found);
      if (found.data) {
        if (event.type === 'video.asset.deleted') {
          checkDb(await db.from('video_assets').update({status:'archived',archived_at:new Date().toISOString()}).eq('id',found.data.id));
        } else await syncVideo(found.data.id);
      } else if (data.passthrough && /^[0-9a-f-]{36}$/i.test(data.passthrough)) {
        throw new Error('local_asset_not_registered_yet');
      }
    }
    checkDb(await db.from('webhook_events').update({processing_status:'processed',status:'processed',processed_at:new Date().toISOString()}).eq('id',storedId));
    recordWebhookMetric('processed');
    return Response.json({received:true,correlation_id:correlationId});
  } catch {
    recordWebhookMetric('failed');
    if (storedId && db) {
      try { await db.from('webhook_events').update({processing_status:'failed'}).eq('id',storedId); } catch { /* Preserve the retryable response. */ }
    }
    console.error('mux_webhook_failed',{correlationId});
    return Response.json({error:'Falha temporária. O evento pode ser reenviado.',correlation_id:correlationId},{status:503});
  }
}
