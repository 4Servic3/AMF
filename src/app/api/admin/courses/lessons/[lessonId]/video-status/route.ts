import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/dal';
import { validateRequestOrigin } from '@/lib/mux';

export async function GET(
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
        { error: 'Permissão insuficiente para visualizar status de vídeos.' },
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

    // 4. Busca da Aula e Vídeo Primário
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, title, video_asset_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }

    // Busca o vídeo primário em lesson_videos ou em video_assets via lesson.video_asset_id
    let assetData = null;

    if (lesson.video_asset_id) {
      const { data: asset } = await supabase
        .from('video_assets')
        .select(
          'id, status, mux_asset_id, mux_playback_id, duration_seconds, aspect_ratio, max_stored_resolution, title, error_message, ready_at'
        )
        .eq('id', lesson.video_asset_id)
        .maybeSingle();

      assetData = asset;
    }

    // Verifica se há tentativa de upload ativa nos últimos 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: activeUpload } = await supabase
      .from('video_uploads')
      .select('id, mux_upload_id, status, created_at')
      .eq('lesson_id', lessonId)
      .eq('status', 'waiting_file')
      .gt('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json(
      {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        video: assetData
          ? {
              id: assetData.id,
              status: assetData.status,
              mux_playback_id: assetData.mux_playback_id,
              duration_seconds: assetData.duration_seconds,
              aspect_ratio: assetData.aspect_ratio,
              max_stored_resolution: assetData.max_stored_resolution,
              title: assetData.title,
              error_message: assetData.error_message,
              ready_at: assetData.ready_at,
            }
          : null,
        active_upload: activeUpload
          ? {
              id: activeUpload.id,
              mux_upload_id: activeUpload.mux_upload_id,
              status: activeUpload.status,
              created_at: activeUpload.created_at,
            }
          : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar status do vídeo.' },
      { status: 500 }
    );
  }
}
