import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Run from the AMF repo: node scripts/provision-planilha.mjs <source-directory> [--apply]
// Clinical source files stay OUTSIDE this public repository.
try { process.loadEnvFile('.env.local'); } catch { /* Hosted env may already be set. */ }
const source = process.argv[2];
if (!source || source.startsWith('--')) throw new Error('Provide the original product directory.');
const apply = process.argv.includes('--apply');
const productId = 'f6748b06-8efa-4dc6-a28f-96a17d14b7fd';
const bucket = 'amf_product_files';
const root = resolve(source);
const workbook = await readFile(join(root, 'Doses_Seguras_Felinos_v13_Polyana.xlsx'));
const dataset = await readFile(join(root, 'Planilha Web', 'src', 'data', 'data.json'));
const parsed = JSON.parse(dataset.toString('utf8'));
if (!Array.isArray(parsed.categories) || !parsed.categories.length) throw new Error('Invalid supplied dataset.');
if (workbook[0] !== 0x50 || workbook[1] !== 0x4b) throw new Error('Invalid XLSX container.');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
function check(error) { if (error) throw new Error('Provisioning failed: ' + (error.code || error.statusCode || 'service_error')); }
const existing = await db.from('products').select('id,name,type,status').eq('id', productId).maybeSingle();check(existing.error);
const candidates = await db.from('products').select('id,name').ilike('name', '%doses%');check(candidates.error);
if (candidates.data.some(p => p.id !== productId)) throw new Error('A doses product already exists. Reconcile its ID before provisioning.');
console.log(JSON.stringify({ mode: apply ? 'apply' : 'read-only', productExists: !!existing.data, datasetCategories: parsed.categories.length, workbookBytes: workbook.length, workbookSha256: createHash('sha256').update(workbook).digest('hex') }));
if (!apply) process.exit(0);
if (!existing.data) {
  const result = await db.from('products').insert({ id: productId, name: 'Doses Seguras para Felinos', description: 'Calculadora web e planilha Excel da Dra. Polyana.', type: 'bundle', status: 'active', is_free: false, featured: false });check(result.error);
} else if (existing.data.type !== 'bundle' || existing.data.status !== 'active') {
  throw new Error('Existing product configuration differs; preserved without modification.');
}
const buckets = await db.storage.listBuckets();check(buckets.error);
const found = buckets.data.find(b => b.id === bucket);
if (found?.public) throw new Error('Refusing to upload paid content to a public bucket.');
if (!found) {
  const result = await db.storage.createBucket(bucket, { public: false, fileSizeLimit: 10485760, allowedMimeTypes: ['application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] });check(result.error);
}
for (const [key, bytes, contentType] of [
  ['planilha-felinos/v13/Doses_Seguras_Felinos_v13_Polyana.xlsx', workbook, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['planilha-felinos/v13/data.json', dataset, 'application/json'],
]) {
  const result = await db.storage.from(bucket).upload(key, bytes, { contentType, upsert: true, cacheControl: '0' });check(result.error);
  const saved = await db.storage.from(bucket).download(key);check(saved.error);
  const actual = Buffer.from(await saved.data.arrayBuffer());
  if (!actual.equals(bytes)) throw new Error('Uploaded file verification failed.');
  console.log(key.split('/').pop() + ': uploaded and byte-verified');
}
console.log('Provisioned private product files; no customer access was modified.');
