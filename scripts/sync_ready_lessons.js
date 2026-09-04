const { createClient } = require('@supabase/supabase-js');
const { Mux } = require('@mux/mux-node');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const LESSONS = [
  {
    name: 'Aula 1',
    lessonId: 'a56f95f6-d8c0-4bbf-82d9-559aa325461d',
    assetId: '8fEiJ01vLlV01M9VQ7VIYnmI01ZHc400UujAJzn02wwqacm4',
  },
  {
    name: 'Aula 2',
    lessonId: 'd6eb9e09-4865-4e74-9439-96a6185a9548',
    assetId: 'kWTSTTf023s02y3qtBWFcM6yxRSX001Cu7blGQWdAeI7uM',
  },
];

const ADMIN_USER_ID = '47f7883b-721c-47cd-8fc0-44a8e1e3e673';

async function checkAndSync() {
  console.log('Verificando status dos assets no Mux...');
  let allReady = true;

  for (const item of LESSONS) {
    try {
      const asset = await mux.video.assets.retrieve(item.assetId);
      console.log(`[${item.name}] Asset ID: ${item.assetId} | Status Mux: ${asset.status}`);

      if (asset.status === 'ready') {
        const durationSeconds = Math.round(asset.duration || 0);
        const aspectRatio = asset.aspect_ratio || '16:9';
        const maxStoredRes = asset.max_stored_resolution || '1080p';
        const signedPlayback = asset.playback_ids?.find(p => p.policy === 'signed');
        const playbackId = signedPlayback ? signedPlayback.id : null;

        console.log(`  -> PRONTO! Duração: ${durationSeconds}s (${(durationSeconds / 60).toFixed(1)}min), Aspect Ratio: ${aspectRatio}, Resolução: ${maxStoredRes}`);
        console.log(`  -> Playback ID (signed): ${playbackId}`);

        // Localiza ou atualiza o registro em video_assets
        const { data: existingAsset } = await supabase
          .from('video_assets')
          .select('id, status')
          .eq('mux_asset_id', item.assetId)
          .maybeSingle();

        let assetUuid = existingAsset?.id;

        if (!existingAsset) {
          // Busca por upload_id ou cria
          const { data: byUpload } = await supabase
            .from('video_assets')
            .select('id')
            .eq('mux_upload_id', asset.upload_id)
            .maybeSingle();
          assetUuid = byUpload?.id;
        }

        if (assetUuid) {
          await supabase
            .from('video_assets')
            .update({
              status: 'ready',
              provider_asset_id: item.assetId,
              mux_asset_id: item.assetId,
              mux_playback_id: playbackId,
              duration_seconds: durationSeconds,
              aspect_ratio: aspectRatio,
              max_stored_resolution: maxStoredRes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', assetUuid);

          await supabase
            .from('video_uploads')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('video_asset_id', assetUuid);

          // Atualiza duration e vínculo da aula (mantendo status sem publicar automaticamente)
          await supabase
            .from('lessons')
            .update({
              video_asset_id: assetUuid,
              duration_seconds: durationSeconds,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.lessonId);

          // lesson_videos
          await supabase
            .from('lesson_videos')
            .upsert({
              lesson_id: item.lessonId,
              video_asset_id: assetUuid,
              is_primary: true,
              label: item.name,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'lesson_id,video_asset_id' });

          console.log(`  -> Banco Supabase sincronizado com sucesso para ${item.name}!`);
        }
      } else {
        allReady = false;
      }
    } catch (e) {
      console.error(`Erro ao verificar ${item.name}:`, e.message);
      allReady = false;
    }
  }

  return allReady;
}

async function loop() {
  const isDone = await checkAndSync();
  if (isDone) {
    console.log('\nTodos os assets estão READY e sincronizados!');
    process.exit(0);
  } else {
    console.log('\nAguardando próxima checagem...');
  }
}

loop();
