import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PDF_DIR = 'C:\\Users\\Administrador\\Desktop\\AMF\\Produtos\\Imersao Clinica em Felinos\\entregaveis em pdf';
const BUCKET_NAME = 'course-materials';

async function importPDFs() {
  console.log('--- Iniciando Importação de PDFs ---');

  // 1. Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.find(b => b.name === BUCKET_NAME);
  if (!bucketExists) {
    console.log(`Criando bucket: ${BUCKET_NAME}`);
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  } else {
    console.log(`Bucket ${BUCKET_NAME} já existe (public: false).`);
  }

  // 2. Load Course and Module 3
  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', 'imersao-clinica-de-felinos-parte-1')
    .single();

  if (!course) throw new Error('Curso não encontrado.');

  const { data: module3 } = await supabase
    .from('course_modules')
    .select('id, title')
    .eq('course_id', course.id)
    .ilike('title', '%Materiais da Aula%')
    .single();

  if (!module3) throw new Error('Módulo 3 não encontrado.');

  // Fetch all pdf lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, type')
    .eq('module_id', module3.id)
    .eq('type', 'pdf_material');

  const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  console.log(`\nEncontrados ${files.length} PDFs no diretório local.`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(PDF_DIR, file);
    const stat = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    // Validate magic bytes
    if (buffer.toString('utf-8', 0, 4) !== '%PDF') {
      console.error(`❌ ${file} não é um PDF válido.`);
      failCount++;
      continue;
    }

    // Hash
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Find corresponding lesson
    const lesson = lessons?.find(l => l.title === file);
    if (!lesson) {
      console.error(`❌ Lesson não encontrada para ${file}. (Verifique nome exato)`);
      failCount++;
      continue;
    }

    // Check if already imported
    const { data: existingMaterial } = await supabase
      .from('lesson_materials')
      .select('id')
      .eq('lesson_id', lesson.id)
      .eq('checksum', checksum)
      .single();

    if (existingMaterial) {
      console.log(`⚠️ ${file} já importado (Checksum ID: ${existingMaterial.id}). Pulando...`);
      successCount++;
      continue;
    }

    const uuid = crypto.randomUUID();
    const storagePath = `${course.id}/${module3.id}/${uuid}.pdf`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error(`❌ Falha no upload de ${file}:`, uploadError.message);
      failCount++;
      continue;
    }

    // Insert into lesson_materials
    const { error: insertError } = await supabase
      .from('lesson_materials')
      .insert({
        lesson_id: lesson.id,
        course_id: course.id,
        title: file,
        name: file,
        storage_path: storagePath,
        type: 'pdf',
        mime_type: 'application/pdf',
        size_bytes: stat.size,
        checksum: checksum,
        bucket_name: BUCKET_NAME,
        view_policy: 'private',
        download_policy: 'allowed',
        status: 'published'
      });

    if (insertError) {
      console.error(`❌ Falha ao inserir registro do material ${file}:`, insertError.message);
      // rollback upload?
      failCount++;
    } else {
      console.log(`✅ Sucesso: ${file} importado e linkado a ${lesson.id}`);
      successCount++;
    }
  }

  console.log(`\n--- Importação Concluída ---`);
  console.log(`Sucesso: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
}

importPDFs().catch(console.error);
