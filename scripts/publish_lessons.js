const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_USER_ID = '47f7883b-721c-47cd-8fc0-44a8e1e3e673';
const LESSON_IDS = [
  'a56f95f6-d8c0-4bbf-82d9-559aa325461d', // Aula 1
  'd6eb9e09-4865-4e74-9439-96a6185a9548'  // Aula 2
];

async function publishLessons() {
  console.log('=== PUBLICAÇÃO CONSCIENTE DAS AULAS 1 E 2 ===');
  for (const id of LESSON_IDS) {
    const { data: before } = await supabase
      .from('lessons')
      .select('id, title, status, video_asset_id')
      .eq('id', id)
      .single();

    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao publicar:', id, updateError);
      continue;
    }

    // Registrar log de auditoria
    await supabase.from('admin_audit_logs').insert({
      admin_id: ADMIN_USER_ID,
      action: 'publish_lesson',
      resource_type: 'lesson',
      resource_id: id,
      details: {
        title: before.title,
        previous_status: before.status,
        new_status: 'published',
        video_asset_id: before.video_asset_id,
        published_at: new Date().toISOString()
      }
    });

    console.log(`Aula "${before.title}" (${id}) publicada com sucesso!`);
    console.log(`  Status anterior: ${before.status} -> Novo status: published`);
    console.log(`  Log de auditoria registrado para o administrador ${ADMIN_USER_ID}.`);
  }
}

publishLessons().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
