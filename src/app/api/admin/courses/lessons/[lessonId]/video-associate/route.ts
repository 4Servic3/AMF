import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, writeAdminAuditEvent } from '@/lib/auth/dal';
import { validateRequestOrigin, retrieveAsset, ensureSignedPlaybackId } from '@/lib/mux';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    // 1. Validação de Autenticação e MFA (AAL2)
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!mfaData || mfaData.currentLevel !== 'aal2') {
      return NextResponse.json(
        { error: 'Autenticação de dois fatores (MFA/AAL2) obrigatória.' },
        { status: 403 }
      );
    }

    // 2. Validação de Permissão RBAC
    const canManage =
      (await hasPermission('courses.videos.manage')) ||
      (await hasPermission('courses.manage')) ||
      (await hasPermission('content.manage'));

    if (!canManage) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para gerenciar vídeos.' },
        { status: 403 }
      );
    }

    // 3. Validação de Origem
    const { allowed } = validateRequestOrigin(req);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Origem da requisição não autorizada.' },
        { status: 403 }
      );
    }

    // 4. Leitura e Sanitização do Payload
    const body = await req.json().catch(() => ({}));
    const rawAssetId = body.mux_asset_id;

    if (!rawAssetId || typeof rawAssetId !== 'string') {
      return NextResponse.json(
        { error: 'Identificador do Asset Mux (mux_asset_id) é obrigatório.' },
        { status: 400 }
      );
    }

    const muxAssetId = rawAssetId.trim();

    // Rejeição estrita de URLs, códigos HTML ou iframes arbitrários
    if (!/^[a-zA-Z0-9_\-]+$/.test(muxAssetId) || muxAssetId.length > 100) {
      return NextResponse.json(
        { error: 'Formato de Mux Asset ID inválido. URLs, iframes ou scripts não são permitidos.' },
        { status: 400 }
      );
    }

    // 5. Confirmação da Aula
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }

    // 6. Consulta Segura diretamente na API do Mux
    const asset = await retrieveAsset(muxAssetId);

    if (!asset || (asset.status !== 'ready' && asset.status !== 'preparing')) {
      return NextResponse.json(
        { error: `O asset informado no Mux não está disponível (Status: ${asset?.status || 'desconhecido'}).` },
        { status: 400 }
      );
    }

    // 7. Confirmação ou Criação de Playback ID Assinado (signed)
    const signedPlaybackId = await ensureSignedPlaybackId(muxAssetId);

    // 8. Sincronização em video_assets
    const durationSeconds = asset.duration ? Math.round(asset.duration) : null;
    const aspectRatio = asset.aspect_ratio || null;
    const maxResolution = asset.max_stored_resolution || null;

    let videoAssetId: string;

    const { data: existingAsset } = await supabase
      .from('video_assets')
      .select('id')
      .eq('mux_asset_id', muxAssetId)
      .maybeSingle();

    if (existingAsset) {
      videoAssetId = existingAsset.id;
      await supabase
        .from('video_assets')
        .update({
          mux_playback_id: signedPlaybackId,
          playback_policy: 'signed',
          status: asset.status === 'ready' ? 'ready' : 'processing',
          duration_seconds: durationSeconds,
          aspect_ratio: aspectRatio,
          max_stored_resolution: maxResolution,
          ready_at: asset.status === 'ready' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoAssetId);
    } else {
      const { data: newAsset, error: insertError } = await supabase
        .from('video_assets')
        .insert({
          provider: 'mux',
          mux_asset_id: muxAssetId,
          mux_playback_id: signedPlaybackId,
          playback_policy: 'signed',
          status: asset.status === 'ready' ? 'ready' : 'processing',
          duration_seconds: durationSeconds,
          aspect_ratio: aspectRatio,
          max_stored_resolution: maxResolution,
          created_by: user.id,
          ready_at: asset.status === 'ready' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError || !newAsset) {
        throw new Error('Falha ao registrar vídeo no banco de dados local.');
      }
      videoAssetId = newAsset.id;
    }

    // 9. Atualização de vínculo de vídeo primário da aula
    // Desmarca outros primários da mesma aula
    await supabase
      .from('lesson_videos')
      .update({ is_primary: false })
      .eq('lesson_id', lessonId);

    // Insere ou atualiza o novo vínculo como primário
    const { error: linkError } = await supabase
      .from('lesson_videos')
      .upsert(
        {
          lesson_id: lessonId,
          video_asset_id: videoAssetId,
          is_primary: true,
          position: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lesson_id,video_asset_id' }
      );

    if (linkError) {
      // Se onConflict falhar por não ter índice composto, insere direto
      await supabase.from('lesson_videos').insert({
        lesson_id: lessonId,
        video_asset_id: videoAssetId,
        is_primary: true,
        position: 1,
      });
    }

    // Atualiza lessons.video_asset_id para retrocompatibilidade
    await supabase
      .from('lessons')
      .update({ video_asset_id: videoAssetId, type: 'video' })
      .eq('id', lessonId);

    // 10. Auditoria Administrativa
    await writeAdminAuditEvent({
      action: 'associate_existing_mux_asset',
      resourceType: 'lesson',
      resourceId: lessonId,
      details: {
        muxAssetId,
        signedPlaybackId,
        videoAssetId,
      },
    });

    return NextResponse.json({
      success: true,
      video_asset_id: videoAssetId,
      status: asset.status,
      duration_seconds: durationSeconds,
      aspect_ratio: aspectRatio,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao associar asset do Mux à aula.' },
      { status: 500 }
    );
  }
}
