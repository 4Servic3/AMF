import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, writeAdminAuditEvent } from '@/lib/auth/dal';
import { validateRequestOrigin } from '@/lib/mux';

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
        { error: 'Permissão insuficiente para substituir vídeos.' },
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

    // 4. Leitura do Payload e Validação do Motivo
    const body = await req.json().catch(() => ({}));
    const { new_video_asset_id, reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        {
          error:
            'A justificativa da substituição do vídeo é obrigatória (mínimo de 5 caracteres).',
        },
        { status: 400 }
      );
    }

    if (!new_video_asset_id || typeof new_video_asset_id !== 'string') {
      return NextResponse.json(
        { error: 'Identificador do novo vídeo (new_video_asset_id) é obrigatório.' },
        { status: 400 }
      );
    }

    // 5. Confirmação do Novo Asset (deve estar pronto e não arquivado)
    const { data: newAsset, error: newAssetError } = await supabase
      .from('video_assets')
      .select('id, status, mux_playback_id')
      .eq('id', new_video_asset_id)
      .single();

    if (newAssetError || !newAsset) {
      return NextResponse.json(
        { error: 'Novo vídeo não encontrado no sistema.' },
        { status: 404 }
      );
    }

    if (newAsset.status !== 'ready') {
      return NextResponse.json(
        {
          error: `O novo vídeo ainda não está pronto para publicação (Status: ${newAsset.status}). Aguarde a conclusão do processamento.`,
        },
        { status: 400 }
      );
    }

    // 6. Localização do Vídeo Anterior para Transição Suave
    const { data: previousLink } = await supabase
      .from('lesson_videos')
      .select('id, video_asset_id')
      .eq('lesson_id', lessonId)
      .eq('is_primary', true)
      .maybeSingle();

    const previousAssetId = previousLink?.video_asset_id || null;

    // 7. Atualização do Vínculo e Arquivamento do Asset Anterior
    if (previousAssetId && previousAssetId !== new_video_asset_id) {
      // Arquiva o asset anterior no banco de dados para preservar histórico e rollback
      await supabase
        .from('video_assets')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', previousAssetId);

      // Desmarca o vínculo anterior como primário
      await supabase
        .from('lesson_videos')
        .update({ is_primary: false })
        .eq('lesson_id', lessonId);
    }

    // Insere ou atualiza o novo vínculo como primário
    const { error: upsertError } = await supabase.from('lesson_videos').upsert(
      {
        lesson_id: lessonId,
        video_asset_id: new_video_asset_id,
        is_primary: true,
        position: 1,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'lesson_id,video_asset_id' }
    );

    if (upsertError) {
      await supabase.from('lesson_videos').insert({
        lesson_id: lessonId,
        video_asset_id: new_video_asset_id,
        is_primary: true,
        position: 1,
      });
    }

    // Atualiza lessons.video_asset_id
    await supabase
      .from('lessons')
      .update({
        video_asset_id: new_video_asset_id,
        type: 'video',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId);

    // 8. Registro de Auditoria Administrativa com o Motivo
    await writeAdminAuditEvent({
      action: 'replace_lesson_video',
      resourceType: 'lesson',
      resourceId: lessonId,
      reason: reason.trim(),
      details: {
        previousAssetId,
        newAssetId: new_video_asset_id,
        lessonId,
      },
    });

    return NextResponse.json({
      success: true,
      lesson_id: lessonId,
      active_video_asset_id: new_video_asset_id,
      archived_video_asset_id: previousAssetId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao substituir o vídeo da aula.' },
      { status: 500 }
    );
  }
}
