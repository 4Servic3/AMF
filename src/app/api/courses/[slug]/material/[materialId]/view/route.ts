import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string, materialId: string }> }) {
  try {
    const { slug, materialId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const { data: hasAccess } = await supabase.rpc('has_course_access', { course_uuid: course.id });
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: material } = await supabase
      .from('lesson_materials')
      .select('storage_path, bucket_name, status, view_policy')
      .eq('id', materialId)
      .eq('course_id', course.id)
      .eq('status', 'published')
      .single();

    if (!material || !material.storage_path) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    if (material.view_policy === 'disabled') {
      return NextResponse.json({ error: 'Viewing not allowed' }, { status: 403 });
    }

    const { data, error } = await supabase
      .storage
      .from(material.bucket_name || 'materials')
      .createSignedUrl(material.storage_path, 300);

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to generate access URL' }, { status: 500 });
    }

    const res = NextResponse.redirect(data.signedUrl, 302);
    res.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    return res;

  } catch (err) {
    console.error('Material view error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
