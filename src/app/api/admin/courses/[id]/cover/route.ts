import { NextRequest, NextResponse } from 'next/server'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { validateRequestOrigin } from '@/lib/mux/origins'
import { revalidatePath } from 'next/cache'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 3 * 1024 * 1024 // Below Vercel's request limit, including multipart headers.
const BUCKET = 'public_media'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateRequestOrigin(req).allowed) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 })
    await requireAal2()
    await requirePermission('courses.manage')

    const { id: courseId } = await params

    if (!/^[0-9a-f-]{36}$/i.test(courseId)) {
      return NextResponse.json({ error: 'ID do curso inválido.' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use JPG, PNG ou WebP.' },
        { status: 422 }
      )
    }

    // Validate size
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Imagem muito grande. Máximo 3 MB.' },
        { status: 422 }
      )
    }

    const supabase = createServiceRoleClient()

    // Verify course exists and belongs to our DB
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, cover_asset_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    }

    // Build a unique storage path: course-covers/{courseId}/{timestamp}.{ext}
    const ext = file.type.split('/')[1] // jpeg, png, webp
    const objectPath = `course-covers/${courseId}/${crypto.randomUUID()}.${ext}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Falha no upload. Tente novamente.' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(objectPath)

    const publicUrl = urlData.publicUrl

    // Register in media_assets
    const { data: asset, error: assetError } = await supabase
      .from('media_assets')
      .insert({
        file_path: objectPath,
        file_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
      })
      .select('id')
      .single()

    if (assetError || !asset) {
      console.error('media_assets insert error:', assetError)
      await supabase.storage.from(BUCKET).remove([objectPath])
      return NextResponse.json({ error: 'Não foi possível registrar a capa. A capa anterior foi preservada.' }, { status: 500 })
    }

    // Update courses.cover_asset_id
    const assetId = asset?.id ?? null
    const { error: updateError } = await supabase
      .from('courses')
      .update({ cover_asset_id: assetId, thumbnail_url: publicUrl })
      .eq('id', courseId)
      .select('id').single()

    if (updateError) {
      console.error('courses update error:', updateError)
      return NextResponse.json(
        { error: 'Imagem salva mas não vinculada. Recarregue a página.' },
        { status: 500 }
      )
    }

    revalidatePath('/admin/courses', 'layout')
    revalidatePath('/app/cursos', 'layout')
    revalidatePath('/app')
    return NextResponse.json({ coverUrl: publicUrl, assetId }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    // requireAal2/requirePermission redirect internally; if they throw, re-throw
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
    console.error('Cover upload unhandled error:', err)
    return NextResponse.json({ error: 'Erro inesperado.' }, { status: 500 })
  }
}
