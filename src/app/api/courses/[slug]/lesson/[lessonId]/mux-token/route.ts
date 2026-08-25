import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string, lessonId: string }> }) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();
    
    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Course & Access check
    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const { data: hasAccess } = await supabase.rpc('has_course_access', { course_uuid: course.id });
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 3. Lesson & Video Asset check
    const { data: lesson } = await supabase
      .from('lessons')
      .select('type, status, video_asset_id')
      .eq('id', lessonId)
      .eq('status', 'published')
      .single();

    if (!lesson || lesson.type !== 'video' || !lesson.video_asset_id) {
      return NextResponse.json({ error: 'Video not available' }, { status: 404 });
    }

    const { data: videoAsset } = await supabase
      .from('video_assets')
      .select('playback_id, playback_policy, status')
      .eq('id', lesson.video_asset_id)
      .single();

    if (!videoAsset || videoAsset.status !== 'ready') {
      return NextResponse.json({ error: 'Video processing' }, { status: 425 });
    }

    if (!videoAsset.playback_id) {
      return NextResponse.json({ error: 'Playback ID missing' }, { status: 500 });
    }

    // 4. Generate Mux JWT
    const signingKey = process.env.MUX_SIGNING_KEY;
    const signingSecret = process.env.MUX_SIGNING_SECRET;

    if (!signingKey || !signingSecret) {
      console.error('Mux signing credentials missing');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Expiration curta de 10 horas max ou algo do tipo
    const token = jwt.sign(
      {
        sub: videoAsset.playback_id,
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) + (10 * 60 * 60) // 10 horas
      },
      Buffer.from(signingSecret, 'base64'),
      { keyid: signingKey, algorithm: 'RS256' } // Note: Mux uses RS256 with PEM, wait, they use RS256 with base64 decoded secret.
    );
    // Actually, Mux uses standard RS256. If signingSecret is base64 of the private key, we decode it.

    const response = NextResponse.json({
      playbackId: videoAsset.playback_id,
      token,
      policy: videoAsset.playback_policy
    });
    
    // Prevent caching
    response.headers.set('Cache-Control', 'private, no-store');
    return response;

  } catch (err) {
    console.error('Mux token error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
