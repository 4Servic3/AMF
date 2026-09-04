import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, writeAdminAuditEvent } from '@/lib/auth/dal';
import { validateRequestOrigin, createDirectUpload } from '@/lib/mux';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    // 1. Validação de Sessão Supabase e MFA (AAL2)
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

    // 2. Validação de Papel/Permissão RBAC
    const canManage =
      (await hasPermission('courses.videos.manage')) ||
      (await hasPermission('courses.manage')) ||
      (await hasPermission('content.manage'));

    if (!canManage) {
      return NextResponse.json(
        { error: 'Permissão insuficiente para gerenciar vídeos de cursos.' },
        { status: 403 }
      );
    }

    // 3. Validação de CSRF e Origem
    const { allowed, origin } = validateRequestOrigin(req);
    if (!allowed || !origin) {
      return NextResponse.json(
        { error: 'Origem da requisição não autorizada.' },
        { status: 403 }
      );
    }

    // 4. Rate Limiting por Administrador (máximo 10 tentativas a cada 10 min)
    const rateLimit = checkRateLimit(`admin_upload_${user.id}`, 10, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Limite de criação de uploads excedido. Aguarde alguns minutos.' },
        { status: 429 }
      );
    }

    // 5. Confirmação de existência da Aula
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, module_id, title')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Aula informada não encontrada.' },
        { status: 404 }
      );
    }

    // 6. Verificação de upload conflitante ativo (últimos 30 minutos em waiting_file)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: activeUploads } = await supabase
      .from('video_uploads')
      .select('id, mux_upload_id')
      .eq('lesson_id', lessonId)
      .eq('status', 'waiting_file')
      .gt('created_at', thirtyMinutesAgo);

    if (activeUploads && activeUploads.length > 0) {
      return NextResponse.json(
        {
          error:
            'Já existe um upload ativo em andamento para esta aula. Cancele-o ou aguarde a finalização.',
        },
        { status: 409 }
      );
    }

    // 7. Geração de UUID interno e criação de Direct Upload no Mux
    const trackingUuid = crypto.randomUUID();

    const directUpload = await createDirectUpload({
      corsOrigin: origin,
      passthrough: trackingUuid,
    });

    // 8. Persistência em video_assets e video_uploads
    const { data: videoAsset, error: assetError } = await supabase
      .from('video_assets')
      .insert({
        id: trackingUuid,
        provider: 'mux',
        provider_asset_id: directUpload.uploadId,
        mux_upload_id: directUpload.uploadId,
        playback_policy: 'signed',
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (assetError || !videoAsset) {
      throw new Error('Falha ao registrar metadados locais do vídeo.');
    }

    await supabase.from('video_uploads').insert({
      lesson_id: lessonId,
      video_asset_id: videoAsset.id,
      mux_upload_id: directUpload.uploadId,
      requested_by: user.id,
      status: 'waiting_file',
    });

    // 9. Registro de Auditoria sem segredos
    await writeAdminAuditEvent({
      action: 'create_mux_direct_upload',
      resourceType: 'lesson',
      resourceId: lessonId,
      details: {
        uploadId: directUpload.uploadId,
        videoAssetId: videoAsset.id,
      },
    });

    // 10. Retorno com cabeçalho de proteção estrita contra cache
    return new NextResponse(
      JSON.stringify({
        upload_url: directUpload.uploadUrl,
        upload_id: directUpload.uploadId,
        video_asset_id: videoAsset.id,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    const isClientSafe =
      error?.message?.includes('Origem') ||
      error?.message?.includes('Limite') ||
      error?.message?.includes('Aula');

    return NextResponse.json(
      {
        error: isClientSafe
          ? error.message
          : 'Erro ao inicializar sessão de upload no serviço de vídeo.',
      },
      { status: isClientSafe ? 400 : 500 }
    );
  }
}
