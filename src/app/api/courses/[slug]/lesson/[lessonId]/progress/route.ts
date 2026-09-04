import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSecureProgress } from '@/lib/services/progress';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string, lessonId: string }> }) {
  try {
    const { slug, lessonId } = await params;
    const { position_seconds, duration_seconds, is_ended } = await req.json();

    if (typeof position_seconds !== 'number') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate if user has access to course
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: hasAccess } = await supabase.rpc('has_course_access', { course_uuid: course.id });
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Validate lesson and fetch its duration from the server
    const { data: lesson } = await supabase
      .from('lessons')
      .select('video_asset_id')
      .eq('id', lessonId)
      .single();

    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    let serverDuration = 0;
    if (lesson.video_asset_id) {
      const { data: videoAsset } = await supabase
        .from('video_assets')
        .select('duration_seconds')
        .eq('id', lesson.video_asset_id)
        .single();
      if (videoAsset && videoAsset.duration_seconds) {
        serverDuration = videoAsset.duration_seconds;
      }
    }

    // 6. Update progress securely and monotonically
    const result = await updateSecureProgress(
      user.id,
      lessonId,
      position_seconds,
      typeof duration_seconds === 'number' ? duration_seconds : undefined,
      Boolean(is_ended)
    );

    return NextResponse.json({
      success: true,
      is_completed: result.is_completed,
      percent: result.progress_percent,
      last_position_seconds: result.last_position_seconds,
    });
  } catch (err) {
    console.error('Progress tracking error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
