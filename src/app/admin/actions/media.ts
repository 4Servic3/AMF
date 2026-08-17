'use server'

import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestUploadUrl(bucket: string, fileName: string, mimeType: string, size: number) {
  await requireAal2()
  await requirePermission('media.manage')
  
  // Mock signed URL generation for now
  const dummySignedUrl = `https://dummy-supabase-url.com/storage/v1/upload/resumable/${bucket}/${fileName}`
  const dummyToken = 'dummy-token-123'
  
  return {
    signedUrl: dummySignedUrl,
    token: dummyToken,
    path: fileName
  }
}

export async function registerAsset(assetData: {
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  bucket_id: string
  path: string
  alt_text?: string
}) {
  const session = await requireAal2()
  await requirePermission('media.manage')
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      ...assetData,
      created_by: session.user.id
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to register asset: ' + error.message)
  }

  revalidatePath('/admin/media')
  return data
}
