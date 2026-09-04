const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const rawKey = (process.env.MUX_PRIVATE_KEY || process.env.MUX_SIGNING_SECRET || '').trim();
const signingKeySecret = rawKey.startsWith('-----BEGIN') 
  ? rawKey 
  : Buffer.from(rawKey, 'base64').toString('ascii');
const signingKeyId = (process.env.MUX_SIGNING_KEY_ID || process.env.MUX_SIGNING_KEY || '').trim();
const playbackRestrictionId = process.env.MUX_PLAYBACK_RESTRICTION_ID;

const LESSONS = [
  { id: 'a56f95f6-d8c0-4bbf-82d9-559aa325461d', title: 'Aula 1' },
  { id: 'd6eb9e09-4865-4e74-9439-96a6185a9548', title: 'Aula 2' }
];

async function testSessions() {
  console.log('=== TESTE DE SESSÃO DE PLAYBACK (AULA 1 E 2) ===');
  for (const item of LESSONS) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, title, duration_seconds, video_assets(*)')
      .eq('id', item.id)
      .single();

    const videoAsset = Array.isArray(lesson.video_assets) ? lesson.video_assets[0] : lesson.video_assets;
    const playbackId = videoAsset.mux_playback_id;

    const duration = videoAsset.duration_seconds || 1800;
    const ttlSeconds = Math.max(1800, duration + 600);
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;

    const videoToken = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp,
        playback_restriction_id: playbackRestrictionId,
      },
      signingKeySecret,
      { algorithm: 'RS256', keyid: signingKeyId }
    );

    const thumbToken = jwt.sign(
      {
        sub: playbackId,
        aud: 't',
        exp,
        playback_restriction_id: playbackRestrictionId,
      },
      signingKeySecret,
      { algorithm: 'RS256', keyid: signingKeyId }
    );

    const storyToken = jwt.sign(
      {
        sub: playbackId,
        aud: 's',
        exp,
        playback_restriction_id: playbackRestrictionId,
      },
      signingKeySecret,
      { algorithm: 'RS256', keyid: signingKeyId }
    );

    console.log(`\n[${item.title}]`);
    console.log(`  Playback ID: ${playbackId}`);
    console.log(`  Duração: ${duration}s (${(duration/60).toFixed(1)}min)`);
    console.log(`  TTL Token: ${ttlSeconds}s (${(ttlSeconds/3600).toFixed(2)}h)`);
    console.log(`  Token Playback (primeiros 25 chars): ${videoToken.substring(0, 25)}...`);
    console.log(`  Token Thumbnail (primeiros 25 chars): ${thumbToken.substring(0, 25)}...`);
    console.log(`  Token Storyboard (primeiros 25 chars): ${storyToken.substring(0, 25)}...`);
    
    // Decodificar cabeçalho e payload para conferência
    const decodedHeader = jwt.decode(videoToken, { complete: true }).header;
    const decodedPayload = jwt.decode(videoToken, { complete: true }).payload;
    console.log(`  Header RS256 alg: ${decodedHeader.alg}, kid: ${decodedHeader.kid}`);
    console.log(`  Claims aud: ${decodedPayload.aud}, sub: ${decodedPayload.sub}, restriction: ${decodedPayload.playback_restriction_id}`);
  }
}

testSessions().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
