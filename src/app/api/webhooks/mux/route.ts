import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Requerimento: validar assinatura do webhook e idempotência de eventos
export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('mux-signature');
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      return NextResponse.json({ error: 'Missing secret or signature' }, { status: 401 });
    }

    // Verify signature
    const elements = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = elements['t'];
    const v1Signature = elements['v1'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    if (expectedSignature !== v1Signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Replay protection (e.g. max 5 minutes old)
    if (Date.now() - parseInt(timestamp, 10) * 1000 > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Timestamp too old' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const supabase = await createClient();

    // Idempotency: check if event was already processed
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('provider', 'mux')
      .eq('external_id', event.id)
      .single();

    if (existingEvent) {
      return NextResponse.json({ received: true, note: 'already processed' });
    }

    // Log the event as pending
    const { data: storedEvent, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'mux',
        external_id: event.id,
        type: event.type,
        payload: event,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }

    // Process event
    if (event.type === 'video.asset.ready') {
      const assetId = event.data.id;
      const playbackId = event.data.playback_ids?.find((p: any) => p.policy === 'signed')?.id || event.data.playback_ids?.[0]?.id;
      const duration = event.data.duration;

      await supabase
        .from('video_assets')
        .update({
          status: 'ready',
          playback_id: playbackId,
          duration_seconds: Math.floor(duration || 0)
        })
        .eq('provider_asset_id', assetId)
        .eq('provider', 'mux');
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', storedEvent.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Mux webhook error:', error);
    // "nenhum erro retorna segredo ou URL privada"
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
