const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const COURSE_ID = '918c176f-8d14-43a9-89e9-67aa43820a9d';
const ENTITLED_USER_ID = '47f7883b-721c-47cd-8fc0-44a8e1e3e673';
const UNENTITLED_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testAccess() {
  console.log('=== TESTE DA MATRIZ DE ACESSO (ENTITLEMENTS) ===');
  
  // 1. Aluno com Entitlement
  const { data: entitledCheck } = await supabase.from('entitlements').select('*')
    .eq('profile_id', ENTITLED_USER_ID)
    .eq('resource_id', COURSE_ID)
    .eq('status', 'active');
  
  console.log('Aluno com Entitlement (amf@admin.com):');
  console.log('  Encontrado no banco:', entitledCheck?.length > 0 ? 'SIM' : 'NÃO');
  console.log('  Status:', entitledCheck?.[0]?.status);
  console.log('  Validade:', entitledCheck?.[0]?.expires_at || 'Vitalício / Sem expiração');

  // 2. Aluno sem Entitlement
  const { data: unentitledCheck } = await supabase.from('entitlements').select('*')
    .eq('profile_id', UNENTITLED_USER_ID)
    .eq('resource_id', COURSE_ID)
    .eq('status', 'active');

  console.log('\nUsuário sem Acesso (ID aleatório):');
  console.log('  Encontrado no banco:', unentitledCheck?.length > 0 ? 'SIM' : 'NÃO (Acesso Bloqueado com 403)');

  // 3. Status das Aulas no Módulo 1
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, status, duration_seconds, video_asset_id, video_assets(status, mux_playback_id)')
    .in('id', ['a56f95f6-d8c0-4bbf-82d9-559aa325461d', 'd6eb9e09-4865-4e74-9439-96a6185a9548'])
    .order('order_index');

  console.log('\nStatus das Aulas no Curso:');
  for (const l of lessons) {
    const asset = Array.isArray(l.video_assets) ? l.video_assets[0] : l.video_assets;
    console.log(`  - ${l.title}: status=${l.status}, duration=${l.duration_seconds}s, asset_status=${asset?.status}, playback_id=${asset?.mux_playback_id}`);
  }

  // 4. Módulo 2 (Comunidade / WhatsApp)
  const { data: mod2 } = await supabase
    .from('lessons')
    .select('id, title, type, status')
    .eq('module_id', 'f2f66d78-baca-4b32-98c5-c5e5f3a7c966');
  console.log('\nMódulo 2 (WhatsApp/Network) Intacto:', mod2);

  // 5. Módulo 3 (PDFs)
  const { data: mod3 } = await supabase
    .from('lessons')
    .select('id, title, type, status')
    .eq('module_id', '9566b2a5-cf8c-4eff-99d5-c9dc4e809201');
  console.log(`\nMódulo 3 (Materiais) Intacto: ${mod3?.length} PDFs publicados.`);
}

testAccess().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
