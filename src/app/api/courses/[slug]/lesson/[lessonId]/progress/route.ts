import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Check existing progress to prevent regression
    const { data: existingProgress } = await supabase
      .from('lesson_progress')
      .select('last_position_seconds, progress_percent, is_completed, first_started_at')
      .eq('profile_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    let newIsCompleted = existingProgress?.is_completed || false;
    let newProgressPercent = existingProgress?.progress_percent || 0;
    
    // Check reasonable monotonicity (client shouldn't jump 100% instantly if not ended)
    if (serverDuration > 0) {
      const calculatedPercent = Math.min((position_seconds / serverDuration) * 100, 100);
      if (calculatedPercent > newProgressPercent) {
        newProgressPercent = calculatedPercent;
      }
      
      // Concluído se assistir > 90% (ignoring is_ended from client to avoid cheating)
      if (newProgressPercent >= 90) {
        newIsCompleted = true;
        newProgressPercent = 100;
      }
    } else if (lesson.video_asset_id === null) {
      // For non-video lessons, allow marking as complete
      if (is_ended) {
        newIsCompleted = true;
        newProgressPercent = 100;
      }
    }

    const { error: upsertError } = await supabase
      .from('lesson_progress')
      .upsert({
        profile_id: user.id,
        lesson_id: lessonId,
        course_id: course.id,
        is_completed: newIsCompleted,
        last_position_seconds: Math.max(existingProgress?.last_position_seconds || 0, position_seconds),
        progress_percent: newProgressPercent,
        status: newIsCompleted ? 'completed' : 'in_progress',
        first_started_at: existingProgress?.first_started_at || new Date().toISOString(),
        completed_at: (newIsCompleted && !existingProgress?.is_completed) ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,lesson_id' });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ success: true, is_completed: newIsCompleted, percent: newProgressPercent });
  } catch (err) {
    console.error('Progress tracking error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
