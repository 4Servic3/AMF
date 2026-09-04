const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');
const { createClient } = require('@supabase/supabase-js');
const { Mux } = require('@mux/mux-node');

// 1. Validar Credenciais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;
const playbackRestrictionId = process.env.MUX_PLAYBACK_RESTRICTION_ID;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Variáveis do Supabase ausentes.');
  process.exit(1);
}

if (!muxTokenId || !muxTokenSecret) {
  console.error('ERRO: Variáveis do Mux ausentes.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const mux = new Mux({
  tokenId: muxTokenId,
  tokenSecret: muxTokenSecret,
});

// Configuração das Aulas
const LESSONS_CONFIG = [
  {
    name: 'Aula 1',
    lessonId: 'a56f95f6-d8c0-4bbf-82d9-559aa325461d',
    filePath: 'C:\\Users\\Administrador\\Downloads\\Aula 1.mp4',
    title: 'Aula 1 — Imersão Clínica de Felinos',
  },
  {
    name: 'Aula 2',
    lessonId: 'd6eb9e09-4865-4e74-9439-96a6185a9548',
    filePath: 'C:\\Users\\Administrador\\Downloads\\Aula 2.mp4',
    title: 'Aula 2 — Imersão Clínica de Felinos',
  },
];

const ADMIN_USER_ID = '47f7883b-721c-47cd-8fc0-44a8e1e3e673';

function uploadFileToUrl(filePath, uploadUrl) {
  return new Promise((resolve, reject) => {
    const fileStat = fs.statSync(filePath);
    const totalSize = fileStat.size;
    let uploadedBytes = 0;
    let lastReportPercent = 0;

    const parsedUrl = new URL(uploadUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.request(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': totalSize,
        'Content-Type': 'video/mp4',
      },
    }, (res) => {
      console.log(`[Upload] Resposta HTTP Mux: ${res.statusCode} ${res.statusMessage}`);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        let errBody = '';
        res.on('data', chunk => errBody += chunk);
        res.on('end', () => {
          reject(new Error(`Falha no upload HTTP ${res.statusCode}: ${errBody}`));
        });
      }
    });

    req.on('error', (err) => {
      reject(err);
    });

    // Leitura em chunks de 2MB para eficiência de transferência
    const readStream = fs.createReadStream(filePath, { highWaterMark: 2 * 1024 * 1024 });

    readStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const currentPercent = Math.floor((uploadedBytes / totalSize) * 100);
      if (currentPercent >= lastReportPercent + 5 || currentPercent === 100) {
        lastReportPercent = currentPercent;
        const mbUploaded = (uploadedBytes / (1024 * 1024)).toFixed(1);
        const mbTotal = (totalSize / (1024 * 1024)).toFixed(1);
        console.log(`[Upload] Progresso: ${currentPercent}% (${mbUploaded} MB / ${mbTotal} MB)`);
      }
    });

    readStream.on('error', (err) => {
      req.destroy(err);
      reject(err);
    });

    readStream.pipe(req);
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processLesson(config) {
  console.log(`\n=======================================================`);
  console.log(`INICIANDO FLUXO SEGURO PARA: ${config.name} (${config.title})`);
  console.log(`=======================================================`);

  // 1. Validar arquivo local
  if (!fs.existsSync(config.filePath)) {
    throw new Error(`Arquivo não encontrado: ${config.filePath}`);
  }
  const stat = fs.statSync(config.filePath);
  console.log(`1. Arquivo local verificado: ${(stat.size / (1024 * 1024)).toFixed(1)} MB`);

  // 2. Validar existência da aula no Supabase
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, title, status, module_id, course_modules(id, course_id)')
    .eq('id', config.lessonId)
    .single();

  if (lessonError || !lesson) {
    throw new Error(`Aula não encontrada no banco: ${config.lessonId}`);
  }
  console.log(`2. Aula confirmada no banco: "${lesson.title}" | Status atual: "${lesson.status}"`);

  // 3. Criar Direct Upload no Mux com Playback Restriction e Signed Policy
  console.log(`3. Criando Direct Upload no Mux com playback_policy=['signed']...`);
  const trackingUuid = crypto.randomUUID();

  const newAssetSettings = {
    playback_policy: ['signed'],
    max_resolution_tier: '1080p',
    passthrough: trackingUuid,
  };
  if (playbackRestrictionId) {
    newAssetSettings.playback_restriction_id = playbackRestrictionId;
  }

  const directUpload = await mux.video.uploads.create({
    cors_origin: 'https://amf-eight.vercel.app',
    new_asset_settings: newAssetSettings,
  });

  console.log(`   Upload ID Mux: ${directUpload.id}`);
  console.log(`   URL de Upload obtida com sucesso.`);

  // 4. Registrar em video_assets e video_uploads
  console.log(`4. Registrando metadados em video_assets e video_uploads (status: pending)...`);
  const { data: videoAsset, error: assetError } = await supabase
    .from('video_assets')
    .insert({
      id: trackingUuid,
      provider: 'mux',
      provider_asset_id: directUpload.id,
      mux_upload_id: directUpload.id,
      playback_policy: 'signed',
      status: 'pending',
      title: config.title,
      created_by: ADMIN_USER_ID,
    })
    .select()
    .single();

  if (assetError || !videoAsset) {
    throw new Error(`Erro ao salvar video_assets: ${assetError?.message}`);
  }

  const { error: uploadError } = await supabase.from('video_uploads').insert({
    lesson_id: config.lessonId,
    video_asset_id: videoAsset.id,
    mux_upload_id: directUpload.id,
    requested_by: ADMIN_USER_ID,
    status: 'waiting_file',
  });

  if (uploadError) {
    throw new Error(`Erro ao salvar video_uploads: ${uploadError?.message}`);
  }

  // 5. Enviar arquivo diretamente ao Mux via streaming PUT
  console.log(`5. Iniciando envio direto do arquivo para o Mux...`);
  await supabase
    .from('video_uploads')
    .update({ status: 'uploading', updated_at: new Date().toISOString() })
    .eq('mux_upload_id', directUpload.id);

  await uploadFileToUrl(config.filePath, directUpload.url);
  console.log(`   Envio binário para o Mux CONCLUÍDO com sucesso!`);

  // 6. Aguardar processamento do Mux até 'ready'
  console.log(`6. Aguardando Mux codificar o vídeo (processing -> ready)...`);
  let assetId = null;
  let isReady = false;
  let attempts = 0;
  const maxAttempts = 120; // até 10 minutos de polling (a cada 5s)

  while (!isReady && attempts < maxAttempts) {
    attempts++;
    await sleep(5000);

    // Se ainda não temos o asset_id, buscamos pelo upload
    if (!assetId) {
      const uploadStatus = await mux.video.uploads.retrieve(directUpload.id);
      if (uploadStatus.asset_id) {
        assetId = uploadStatus.asset_id;
        console.log(`   Mux criou o Asset ID: ${assetId} (status: ${uploadStatus.status})`);
        
        await supabase
          .from('video_assets')
          .update({
            mux_asset_id: assetId,
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoAsset.id);

        await supabase
          .from('video_uploads')
          .update({
            status: 'asset_created',
            updated_at: new Date().toISOString(),
          })
          .eq('mux_upload_id', directUpload.id);
      } else {
        console.log(`   [${attempts}] Upload status: ${uploadStatus.status}...`);
        continue;
      }
    }

    // Agora verificamos o asset
    const asset = await mux.video.assets.retrieve(assetId);
    console.log(`   [${attempts}] Asset status: ${asset.status} | Progresso de codificação...`);

    if (asset.status === 'ready') {
      isReady = true;
      const durationSeconds = Math.round(asset.duration || 0);
      const aspectRatio = asset.aspect_ratio || '16:9';
      const maxStoredRes = asset.max_stored_resolution || '1080p';
      
      const signedPlayback = asset.playback_ids?.find(p => p.policy === 'signed');
      const playbackId = signedPlayback ? signedPlayback.id : null;

      if (!playbackId) {
        throw new Error('Asset está ready mas não possui playback_id signed!');
      }

      console.log(`\n>>> ASSET PRONTO NO MUX! <<<`);
      console.log(`   Playback ID (signed): ${playbackId}`);
      console.log(`   Duração: ${durationSeconds} segundos (${(durationSeconds / 60).toFixed(1)} min)`);
      console.log(`   Aspect Ratio: ${aspectRatio}`);
      console.log(`   Resolução Máxima: ${maxStoredRes}`);

      // Atualizar video_assets
      await supabase
        .from('video_assets')
        .update({
          status: 'ready',
          provider_asset_id: assetId,
          mux_playback_id: playbackId,
          duration_seconds: durationSeconds,
          aspect_ratio: aspectRatio,
          max_stored_resolution: maxStoredRes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoAsset.id);

      // Atualizar video_uploads
      await supabase
        .from('video_uploads')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('mux_upload_id', directUpload.id);

      // Vincular à aula: duration_seconds e video_asset_id
      await supabase
        .from('lessons')
        .update({
          video_asset_id: videoAsset.id,
          duration_seconds: durationSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.lessonId);

      // Vincular em lesson_videos (is_primary = true)
      await supabase
        .from('lesson_videos')
        .upsert({
          lesson_id: config.lessonId,
          video_asset_id: videoAsset.id,
          is_primary: true,
          label: config.name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'lesson_id,video_asset_id' });

      // Registrar auditoria
      await supabase.from('admin_audit_logs').insert({
        admin_id: ADMIN_USER_ID,
        action: 'video_asset_ready',
        resource_type: 'lesson',
        resource_id: config.lessonId,
        details: {
          asset_id: assetId,
          playback_id: playbackId,
          duration_seconds: durationSeconds,
          aspect_ratio: aspectRatio,
        },
      });

      console.log(`7. Banco de dados sincronizado e aula vinculada com sucesso.`);
      console.log(`   ATENÇÃO: Status da aula permanece "${lesson.status}" até publicação consciente.`);
      return {
        lessonId: config.lessonId,
        assetId,
        playbackId,
        durationSeconds,
        aspectRatio,
        maxStoredRes,
      };
    } else if (asset.status === 'errored') {
      throw new Error(`Mux asset errored: ${JSON.stringify(asset.errors)}`);
    }
  }

  if (!isReady) {
    throw new Error('Tempo limite excedido aguardando transcodificação do Mux.');
  }
}

async function run() {
  const target = process.argv[2]; // '1', '2' ou 'all'
  console.log(`Iniciando ativação de vídeos. Alvo: ${target || 'Aula 1'}`);

  const lessonsToRun = target === '2' 
    ? [LESSONS_CONFIG[1]]
    : target === 'all'
    ? LESSONS_CONFIG
    : [LESSONS_CONFIG[0]];

  for (const item of lessonsToRun) {
    await processLesson(item);
  }

  console.log('\n=======================================================');
  console.log('TODAS AS ETAPAS DE UPLOAD E ATIVAÇÃO FORAM EXECUTADAS!');
  console.log('=======================================================');
}

run().catch(err => {
  console.error('\nFALHA NA EXECUÇÃO:', err);
  process.exit(1);
});
