import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSecureProgress } from '@/lib/services/progress';
import { validateRequestOrigin } from '@/lib/mux';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    // 1. Origin / CSRF validation
    const { allowed } = validateRequestOrigin(req);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Origem da requisição não autorizada.' },
        { status: 403 }
      );
    }

    // 2. Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticação necessária para registrar progresso.' },
        { status: 401 }
      );
    }

    // 3. Check user status (banned/blocked)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_banned, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.is_banned === true || profile?.status === 'blocked') {
      return NextResponse.json(
        { error: 'Usuário bloqueado.' },
        { status: 403 }
      );
    }

    // 4. Validate body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido.' },
        { status: 400 }
      );
    }

    const { position_seconds, duration_seconds, is_ended } = body;

    if (typeof position_seconds !== 'number' || !Number.isFinite(position_seconds) || position_seconds < 0) {
      return NextResponse.json(
        { error: 'position_seconds inválido.' },
        { status: 400 }
      );
    }

    // 5. Check lesson and course access
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_modules(course_id)')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonError || !lesson || !lesson.course_modules) {
      return NextResponse.json(
        { error: 'Aula não encontrada.' },
        { status: 404 }
      );
    }

    const courseModule = Array.isArray(lesson.course_modules)
      ? lesson.course_modules[0]
      : (lesson.course_modules as any);

    const courseId = courseModule?.course_id;
    if (!courseId) {
      return NextResponse.json(
        { error: 'Curso associado não encontrado.' },
        { status: 404 }
      );
    }

    const { data: hasAccess } = await supabase.rpc('has_course_access', {
      course_uuid: courseId,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso ao curso não autorizado.' },
        { status: 403 }
      );
    }

    // 6. Update progress securely and monotonically
    const result = await updateSecureProgress(
      user.id,
      lessonId,
      position_seconds,
      typeof duration_seconds === 'number' ? duration_seconds : undefined,
      Boolean(is_ended)
    );

    return NextResponse.json(
      {
        success: true,
        is_completed: result.is_completed,
        percent: result.progress_percent,
        last_position_seconds: result.last_position_seconds,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Falha ao registrar progresso.' },
      { status: 500 }
    );
  }
}
