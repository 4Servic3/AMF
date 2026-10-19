"use server";
import { adminDb, queryError } from '@/lib/admin-data';
import { requirePermission, writeAdminAuditEvent } from '@/lib/auth/dal';
import { revalidatePath } from 'next/cache';
import { siteInformationSchema, validatePublication } from '@/lib/site-information-schema';
import { SITE_INFORMATION_KEY } from '@/lib/site-information';
export async function saveSiteInformation(form: FormData) {
  const session = await requirePermission('settings.manage');
  const db = await adminDb('settings.manage');
  const draft = siteInformationSchema.parse(Object.fromEntries(form));
  const publish = form.get('publication') === 'publish';
  if (publish) validatePublication(draft);
  const current = await db.from('app_settings').select('value,updated_at').eq('key',SITE_INFORMATION_KEY).maybeSingle();queryError(current.error);
  if ((current.data?.updated_at || '') !== String(form.get('version') || '')) throw new Error('As informações foram alteradas em outra sessão. Atualize a página antes de salvar.');
  const now = new Date().toISOString();
  const value = { draft, published: publish ? draft : current.data?.value?.published || null, publishedAt: publish ? now : current.data?.value?.publishedAt || null };
  const record = { value, updated_by:session.user.id, updated_at:now };
  const result = current.data ? await db.from('app_settings').update(record).eq('key',SITE_INFORMATION_KEY).eq('updated_at',current.data.updated_at).select('key') : await db.from('app_settings').insert({key:SITE_INFORMATION_KEY,...record,environment:'production',risk_level:'low',description:'Informações institucionais e textos publicados pelo administrador.'}).select('key');
  queryError(result.error);
  if (!result.data?.length) throw new Error('Alteração concorrente. Atualize a página e tente novamente.');
  await writeAdminAuditEvent({action:publish?'publish_site_information':'save_site_information_draft',resourceType:'app_settings',details:{key:SITE_INFORMATION_KEY}});
  revalidatePath('/admin/settings');revalidatePath('/termos');revalidatePath('/privacidade');
}
