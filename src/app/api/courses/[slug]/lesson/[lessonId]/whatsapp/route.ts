import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/services/analytics'; // or wherever it lives

export async function GET(req: Request, { params }: { params: Promise<{ slug: string, lessonId: string }> }) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL('/entrar', req.url));

    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!course) return new NextResponse('Course not found', { status: 404 });

    const { data: hasAccess } = await supabase.rpc('has_course_access', { course_uuid: course.id });
    if (!hasAccess) return new NextResponse('Forbidden', { status: 403 });

    const { data: lesson } = await supabase
      .from('lessons')
      .select('type, status, external_resource_id')
      .eq('id', lessonId)
      .eq('status', 'published')
      .single();

    if (!lesson || lesson.type !== 'external_link' || !lesson.external_resource_id) {
      return new NextResponse('Link not available', { status: 404 });
    }

    const { data: extRes } = await supabase
      .from('external_resources')
      .select('private_destination_url, status')
      .eq('id', lesson.external_resource_id)
      .single();

    if (!extRes || extRes.status !== 'active') {
      return new NextResponse('Link disabled', { status: 400 });
    }

    // Server-side audit for accessing private community
    // Using a generic analytics or audit log. Since we can't be sure if `trackEvent` is server-safe, we just use supabase insert.
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'access_community_link',
      resource_type: 'lesson',
      resource_id: lessonId,
      details: { course_id: course.id }
      // NÃO salvamos a URL destino no jsonb por segurança.
    });

    // Mark lesson as completed automatically if it's just a link
    await supabase.from('lesson_progress').upsert({
      profile_id: user.id,
      lesson_id: lessonId,
      course_id: course.id,
      is_completed: true,
      status: 'completed',
      progress_percent: 100,
      completed_at: new Date().toISOString()
    }, { onConflict: 'profile_id,lesson_id' });

    return NextResponse.redirect(extRes.private_destination_url, 302);

  } catch (err) {
    console.error('WhatsApp redirect error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
