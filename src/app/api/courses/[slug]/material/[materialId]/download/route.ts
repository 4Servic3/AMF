import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string, materialId: string }> }) {
  try {
    const { slug, materialId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { data: course } = await supabase
      .from('courses')
      .select('id, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!course) return new NextResponse('Course not found', { status: 404 });

    const { data: hasAccess } = await supabase.rpc('has_course_access', { course_uuid: course.id });
    if (!hasAccess) return new NextResponse('Forbidden', { status: 403 });

    const { data: material } = await supabase
      .from('lesson_materials')
      .select('storage_path, bucket_name, status, download_policy, name, mime_type, size_bytes')
      .eq('id', materialId)
      .eq('status', 'published')
      .single();

    if (!material || !material.storage_path) {
      return new NextResponse('Material not found', { status: 404 });
    }

    if (material.download_policy === 'disabled') {
      return new NextResponse('Download not allowed', { status: 403 });
    }

    // Baixa do Storage usando supabase.storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(material.bucket_name || 'materials')
      .download(material.storage_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new NextResponse('Error downloading file', { status: 500 });
    }

    // Sanitize filename to prevent header injection or traversal chars
    const safeFilename = (material.name || 'document.pdf').replace(/[^a-zA-Z0-9.\-_ ]/g, '');

    // Convert Blob to Response stream
    const res = new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': material.mime_type || 'application/pdf',
        'Content-Length': fileData.size.toString(),
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'private, no-store, max-age=0'
      }
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'download_material',
      resource_type: 'material',
      resource_id: materialId,
      details: { course_id: course.id }
    });

    return res;

  } catch (err) {
    console.error('Material download error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
