import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  verifyWebhookSignature,
  ensureSignedPlaybackId,
  recordWebhookMetric,
} from '@/lib/mux';

export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();

  try {
    // 1. Leitura do corpo bruto (Raw Body) antes de qualquer parsing de JSON
    const rawBody = await req.text();

    // 2. Verificação Criptográfica da Assinatura (HMAC SHA-256 e Anti-Replay de 5 minutos)
    const { valid, error: sigError } = await verifyWebhookSignature(rawBody, req.headers);

    if (!valid) {
      // Retorno padronizado sem vazar detalhes ou chaves
      return NextResponse.json(
        { error: sigError || 'Assinatura inválida ou expirada.' },
        { status: 401 }
      );
    }

    // 3. Parsing do JSON após validação estrita
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    const eventId = event?.id;
    const eventType = event?.type;

    if (!eventId || !eventType) {
      return NextResponse.json(
        { error: 'Evento Mux incompleto: id e type são obrigatórios.' },
        { status: 400 }
      );
    }

    // 4. Instanciação do Cliente Supabase com Service Role (sem sessão de usuário)
    const supabase = createServiceRoleClient();

    // 5. Idempotência: Inserção prévia em webhook_events com provider_event_id
    // Se o evento já foi registrado, retorna 200 idempotente de imediato
    const { data: storedEvent, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'mux',
        provider_event_id: eventId,
        external_id: eventId,
        type: eventType,
        payload: event,
        processing_status: 'received',
        status: 'pending',
        received_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (insertError) {
      // Chave duplicada indica entrega repetida
      recordWebhookMetric('duplicates');
      return NextResponse.json(
        { received: true, note: 'idempotent_duplicate', correlation_id: correlationId },
        { status: 200 }
      );
    }

    // 6. Tratamento de Eventos do Ciclo de Vida do Mux
    switch (eventType) {
      case 'video.upload.asset_created': {
        const uploadId = event.data?.id;
        const assetId = event.data?.asset_id;

        if (uploadId && assetId) {
          // Atualiza o upload correspondente
          await supabase
            .from('video_uploads')
            .update({
              status: 'asset_created',
              updated_at: new Date().toISOString(),
            })
            .eq('mux_upload_id', uploadId);

          // Atualiza o asset, sem regredir se ele já estiver 'ready' ou 'archived'
          const { data: existingAsset } = await supabase
            .from('video_assets')
            .select('id, status')
            .eq('mux_upload_id', uploadId)
            .maybeSingle();

          if (existingAsset && existingAsset.status !== 'ready' && existingAsset.status !== 'archived') {
            await supabase
              .from('video_assets')
              .update({
                mux_asset_id: assetId,
                status: 'processing',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingAsset.id);
          }
        }
        break;
      }

      case 'video.asset.ready': {
        const assetId = event.data?.id;
        const passthrough = event.data?.passthrough;
        const uploadId = event.data?.upload_id;

        // Localiza o asset por passthrough interno, mux_asset_id ou mux_upload_id
        let targetAssetId: string | null = null;

        if (passthrough) {
          const { data: byPassthrough } = await supabase
            .from('video_assets')
            .select('id, status')
            .eq('id', passthrough)
            .maybeSingle();
          if (byPassthrough) targetAssetId = byPassthrough.id;
        }

        if (!targetAssetId && assetId) {
          const { data: byAssetId } = await supabase
            .from('video_assets')
            .select('id, status')
            .eq('mux_asset_id', assetId)
            .maybeSingle();
          if (byAssetId) targetAssetId = byAssetId.id;
        }

        if (!targetAssetId && uploadId) {
          const { data: byUploadId } = await supabase
            .from('video_assets')
            .select('id, status')
            .eq('mux_upload_id', uploadId)
            .maybeSingle();
          if (byUploadId) targetAssetId = byUploadId.id;
        }

        // Se o asset não existir no banco local (evento órfão), não falha com erro 500
        if (!targetAssetId) {
          break;
        }

        // Seleciona estritamente o Playback ID assinado (policy = signed)
        let signedPlaybackId = event.data?.playback_ids?.find(
          (p: any) => p.policy === 'signed'
        )?.id;

        // Se o payload não trouxer o ID assinado, consulta no Mux
        if (!signedPlaybackId && assetId) {
          try {
            signedPlaybackId = await ensureSignedPlaybackId(assetId);
          } catch {
            // Se falhar em garantir signed, não marca como ready com chave pública
          }
        }

        const durationSeconds = event.data?.duration
          ? Math.round(event.data.duration)
          : null;
        const aspectRatio = event.data?.aspect_ratio || null;
        const maxResolution = event.data?.max_stored_resolution || null;

        await supabase
          .from('video_assets')
          .update({
            mux_asset_id: assetId,
            mux_playback_id: signedPlaybackId || null,
            playback_policy: 'signed',
            duration_seconds: durationSeconds,
            aspect_ratio: aspectRatio,
            max_stored_resolution: maxResolution,
            status: 'ready',
            ready_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetAssetId);

        // Atualiza a tentativa de upload se houver
        if (uploadId) {
          await supabase
            .from('video_uploads')
            .update({
              status: 'asset_created',
              updated_at: new Date().toISOString(),
            })
            .eq('mux_upload_id', uploadId);
        }

        break;
      }

      case 'video.asset.errored': {
        const assetId = event.data?.id;
        const passthrough = event.data?.passthrough;
        const rawErrors = event.data?.errors;

        const errorCode = rawErrors?.type || 'mux_error';
        const errorMsg = Array.isArray(rawErrors?.messages)
          ? rawErrors.messages.join('; ')
          : 'Falha durante o processamento do vídeo no Mux.';

        const sanitizedMsg = errorMsg.slice(0, 255);
        const sanitizedCode = String(errorCode).slice(0, 50);

        // Localiza e atualiza o asset
        if (passthrough) {
          await supabase
            .from('video_assets')
            .update({
              status: 'errored',
              error_code: sanitizedCode,
              error_message: sanitizedMsg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', passthrough);
        } else if (assetId) {
          await supabase
            .from('video_assets')
            .update({
              status: 'errored',
              error_code: sanitizedCode,
              error_message: sanitizedMsg,
              updated_at: new Date().toISOString(),
            })
            .eq('mux_asset_id', assetId);
        }
        break;
      }

      case 'video.asset.deleted': {
        const assetId = event.data?.id;
        if (assetId) {
          await supabase
            .from('video_assets')
            .update({
              status: 'archived',
              archived_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('mux_asset_id', assetId);
        }
        break;
      }

      default:
        // Outros eventos Mux (ex: video.asset.updated) são confirmados de forma idempotente
        break;
    }

    // 7. Marcação final de evento processado com sucesso
    if (storedEvent?.id) {
      await supabase
        .from('webhook_events')
        .update({
          processing_status: 'processed',
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', storedEvent.id);
    }

    recordWebhookMetric('processed');

    return NextResponse.json(
      { received: true, correlation_id: correlationId },
      { status: 200 }
    );
  } catch (error: any) {
    recordWebhookMetric('failed');

    return NextResponse.json(
      {
        error: 'Erro no processamento interno do webhook.',
        correlation_id: correlationId,
      },
      { status: 500 }
    );
  }
}
