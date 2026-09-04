import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  generatePlaybackSessionTokens,
  validateRequestOrigin,
} from '@/lib/mux';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    // 1. Validação de CSRF e Origem logo no início da requisição
    const { allowed } = validateRequestOrigin(req);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Origem da requisição não autorizada.' },
        { status: 403 }
      );
    }

    const { lessonId } = await params;

    // 2. Validação de Sessão Supabase via cookies/headers seguros
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Autenticação necessária para reproduzir este conteúdo.' },
        { status: 401 }
      );
    }

    // Rate Limit por usuário autenticado
    const rateLimit = checkRateLimit(`playback_session_${user.id}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas solicitações simultâneas de reprodução. Aguarde alguns instantes.' },
        { status: 429 }
      );
    }

    // 3. Não aceitar user_id enviado pelo navegador
    // O ID do usuário ativo é estritamente derivado de user.id

    // 4. Confirmar que o usuário está ativo e não bloqueado/banido
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_banned, status, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.is_banned === true || profile?.status === 'blocked') {
      return NextResponse.json(
        { error: 'Acesso do usuário suspenso ou bloqueado.' },
        { status: 403 }
      );
    }

    // 4. Buscar a aula pelo ID e confirmar curso/módulo corretos
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(
        'id, title, status, module_id, video_asset_id, course_modules(id, status, course_id, courses(id, status, title))'
      )
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }

    const courseModule = Array.isArray(lesson.course_modules)
      ? lesson.course_modules[0]
      : (lesson.course_modules as any);

    const course = courseModule && (
      Array.isArray(courseModule.courses) ? courseModule.courses[0] : (courseModule.courses as any)
    );

    if (!courseModule || !course) {
      return NextResponse.json(
        { error: 'Estrutura curricular da aula indisponível.' },
        { status: 404 }
      );
    }

    // 5. Confirmar curso, módulo e aula publicados (ou administrador em pré-visualização)
    const { data: canManage } = await supabase.rpc('has_permission', {
      required_permission: 'courses.videos.manage',
    });
    const isAdmin = Boolean(canManage || profile?.role === 'admin' || profile?.role === 'superadmin');

    if (
      !isAdmin &&
      (lesson.status !== 'published' ||
        courseModule.status !== 'published' ||
        course.status !== 'published')
    ) {
      return NextResponse.json(
        { error: 'Conteúdo em rascunho ou indisponível.' },
        { status: 404 }
      );
    }

    // 6. Confirmar compra, enrollment, assinatura ou entitlement ativo
    const { data: hasAccess } = await supabase.rpc('has_course_access', {
      course_uuid: course.id,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Você não possui acesso ativo a este curso.' },
        { status: 403 }
      );
    }

    // 7. Confirmar que o acesso não expirou nem foi revogado
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('status, expires_at')
      .eq('profile_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();

    if (enrollment) {
      if (enrollment.status === 'suspended' || enrollment.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Matrícula suspensa ou cancelada.' },
          { status: 403 }
        );
      }
      if (enrollment.expires_at && new Date(enrollment.expires_at).getTime() < Date.now()) {
        return NextResponse.json(
          { error: 'O período de acesso a este curso expirou.' },
          { status: 403 }
        );
      }
    }

    // 8. Confirmar vínculo da aula com asset Mux ready e playback policy signed
    let videoAssetId: string | null = lesson.video_asset_id;

    // Busca vínculo primário em lesson_videos se existir
    const { data: primaryLink } = await supabase
      .from('lesson_videos')
      .select('video_asset_id')
      .eq('lesson_id', lesson.id)
      .eq('is_primary', true)
      .maybeSingle();

    if (primaryLink?.video_asset_id) {
      videoAssetId = primaryLink.video_asset_id;
    }

    if (!videoAssetId) {
      return NextResponse.json(
        { error: 'Vídeo da aula não configurado.' },
        { status: 404 }
      );
    }

    // Consulta dos dados técnicos do vídeo via serviceClient (o aluno já teve matrícula e acesso validados nas etapas anteriores)
    const serviceClient = createServiceRoleClient();
    const { data: videoAsset } = await serviceClient
      .from('video_assets')
      .select(
        'id, status, mux_playback_id, playback_policy, duration_seconds, aspect_ratio, max_stored_resolution, title'
      )
      .eq('id', videoAssetId)
      .maybeSingle();

    if (!videoAsset) {
      return NextResponse.json(
        { error: 'Registro do vídeo não encontrado.' },
        { status: 404 }
      );
    }

    if (
      videoAsset.status === 'uploading' ||
      videoAsset.status === 'processing' ||
      videoAsset.status === 'pending'
    ) {
      return NextResponse.json(
        { error: 'O vídeo desta aula ainda está sendo codificado pelo provedor.' },
        { status: 425 }
      );
    }

    if (videoAsset.status !== 'ready') {
      return NextResponse.json(
        { error: 'Vídeo indisponível para reprodução.' },
        { status: 404 }
      );
    }

    if (videoAsset.playback_policy !== 'signed') {
      return NextResponse.json(
        { error: 'Conteúdo requer política de reprodução restrita (signed).' },
        { status: 403 }
      );
    }

    if (!videoAsset.mux_playback_id) {
      return NextResponse.json(
        { error: 'Identificador de reprodução não disponível.' },
        { status: 503 }
      );
    }

    // 9. Aplicar isolamento por organização quando aplicável (AMF single-tenant por padrão)

    // GERAÇÃO DOS TOKENS GRANULARES (RS256)
    const sessionId = crypto.randomUUID();
    const sessionHash = crypto.createHash('sha256').update(sessionId).digest('hex');

    const { tokens, expiresAt } = await generatePlaybackSessionTokens({
      playbackId: videoAsset.mux_playback_id,
      durationSeconds: videoAsset.duration_seconds,
      sessionId,
    });

    // Registro na tabela playback_sessions (sem nunca gravar o JWT bruto)
    await serviceClient.from('playback_sessions').insert({
      user_id: user.id,
      lesson_id: lesson.id,
      video_asset_id: videoAsset.id,
      session_hash: sessionHash,
      expires_at: expiresAt,
    });

    // Posição de retomada da aula
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('last_position_seconds')
      .eq('profile_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    const resumeAtSeconds = progress?.last_position_seconds || 0;

    // Pseudônimo do espectador para analytics Mux sem PII
    const viewerUserId = crypto
      .createHash('sha256')
      .update(`${user.id}:amf_viewer_salt`)
      .digest('hex')
      .substring(0, 16);

    // Resposta com cabeçalhos rigorosos de proteção contra cache
    return new NextResponse(
      JSON.stringify({
        playbackId: videoAsset.mux_playback_id,
        tokens,
        durationSeconds: videoAsset.duration_seconds || 0,
        videoId: videoAsset.id,
        videoTitle: lesson.title,
        viewerUserId,
        resumeAtSeconds,
        expiresAt,
        playerPreferences: {
          autoplay: false,
          preload: 'metadata',
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
          Pragma: 'no-cache',
          Vary: 'Cookie, Origin',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Falha temporária ao inicializar sessão de reprodução.' },
      { status: 500 }
    );
  }
}
