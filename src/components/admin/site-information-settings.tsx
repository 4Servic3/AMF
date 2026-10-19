import { adminDb, queryError } from '@/lib/admin-data';
import { emptySiteInformation, parseSiteInformation } from '@/lib/site-information-schema';
import { SITE_INFORMATION_KEY } from '@/lib/site-information';
import { saveSiteInformation } from '@/app/admin/actions/site-information';
import ActionForm from './ui/ActionForm';
export async function SiteInformationSettings() {
  const db = await adminDb('settings.manage');
  const {data,error} = await db.from('app_settings').select('value,updated_at').eq('key',SITE_INFORMATION_KEY).maybeSingle();queryError(error);
  const info = parseSiteInformation(data?.value?.draft) || emptySiteInformation;
  const input = 'w-full rounded-xl border border-amf-border bg-white px-3 py-3 text-sm';
  return <section className="rounded-xl border border-amf-border bg-white p-6">
    <h2 className="text-lg font-semibold">Responsável, contatos e documentos</h2>
    <p className="mb-5 mt-2 text-sm text-amf-muted-600">Salve um rascunho enquanto prepara os textos. Apenas a versão publicada aparece em Termos e Privacidade.</p>
    <ActionForm action={saveSiteInformation} label="Salvar informações">
      <input type="hidden" name="version" value={data?.updated_at || ''} />
      <div className="grid gap-4 sm:grid-cols-2">{([{name:'organization',label:'Empresa / organização',type:'text'},{name:'responsible',label:'Nome do responsável',type:'text'},{name:'supportEmail',label:'E-mail de suporte',type:'email'},{name:'privacyEmail',label:'E-mail de privacidade',type:'email'}] as const).map(field => <label key={field.name} className="block text-sm font-medium">{field.label}<input name={field.name} type={field.type} defaultValue={info[field.name]} maxLength={254} className={input} /></label>)}</div>
      <label className="block text-sm font-medium">Termos de uso<textarea name="terms" defaultValue={info.terms} maxLength={100000} rows={10} className={input} /></label>
      <label className="block text-sm font-medium">Política de privacidade<textarea name="privacy" defaultValue={info.privacy} maxLength={100000} rows={10} className={input} /></label>
      <label className="block text-sm font-medium">Publicação<select name="publication" defaultValue="draft" className={input}><option value="draft">Salvar rascunho (preservar versão pública)</option><option value="publish">Publicar estas informações</option></select></label>
    </ActionForm>
  </section>;
}
