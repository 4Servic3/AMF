import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAal2, requirePermission } from '@/lib/auth/dal'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const BUCKET = 'public_media'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAal2()
    await requirePermission('courses.manage')

    const { id: courseId } = await params

    if (!courseId || courseId === 'new') {
      return NextResponse.json({ error: 'ID do curso inválido.' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
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
        { error: 'Imagem muito grande. Máximo 5 MB.' },
        { status: 422 }
      )
    }

    const supabase = await createClient()

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
    const objectPath = `course-covers/${courseId}/${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
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
      // Don't fail — the file is uploaded. Just log and continue.
    }

    // Update courses.cover_asset_id
    const assetId = asset?.id ?? null
    const { error: updateError } = await supabase
      .from('courses')
      .update({ cover_asset_id: assetId })
      .eq('id', courseId)

    if (updateError) {
      console.error('courses update error:', updateError)
      return NextResponse.json(
        { error: 'Imagem salva mas não vinculada. Recarregue a página.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ coverUrl: publicUrl, assetId })
  } catch (err: any) {
    // requireAal2/requirePermission redirect internally; if they throw, re-throw
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
    console.error('Cover upload unhandled error:', err)
    return NextResponse.json({ error: 'Erro inesperado.' }, { status: 500 })
  }
}
