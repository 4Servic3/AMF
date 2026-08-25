import { NextResponse } from 'next/server';
import { requireAal2, hasPermission, writeAdminAuditEvent } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const session = await requireAal2();
    const canManage = await hasPermission('content.manage');
    
    if (!canManage) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { cors_origin } = await req.json();

    const muxTokenId = process.env.MUX_TOKEN_ID;
    const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!muxTokenId || !muxTokenSecret) {
      return NextResponse.json({ error: 'Mux credentials missing' }, { status: 500 });
    }

    // Server-side call to Mux to get a direct upload URL
    const response = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${muxTokenId}:${muxTokenSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        new_asset_settings: {
          playback_policy: ['signed'],
        },
        cors_origin,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mux upload error: ${errorText}`);
    }

    const data = await response.json();

    // Persist upload intent to our DB
    const supabase = await createClient();
    const { data: videoAsset, error: insertError } = await supabase
      .from('video_assets')
      .insert({
        provider: 'mux',
        provider_asset_id: data.data.id, // Mux Upload ID initially, will be updated to Asset ID by webhook
        playback_policy: 'signed',
        status: 'uploading'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error('Failed to save video asset record');
    }

    await writeAdminAuditEvent({
      action: 'create_mux_upload',
      resourceType: 'video_asset',
      resourceId: videoAsset.id
    });

    return NextResponse.json({
      upload_url: data.data.url,
      upload_id: data.data.id,
      asset_id_internal: videoAsset.id
    });

  } catch (error: any) {
    console.error('Direct upload error:', error);
    // Security constraint: nenhum erro retorna segredo ou URL privada
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
