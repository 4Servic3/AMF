import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { readPreferences } from '@/lib/member-preferences';
import AccountSettingsForm from '@/components/auth/account-settings-form';
export const metadata = { title: 'Preferências de notificações | AMF' };
export default async function Page() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) redirect('/entrar');
  const { data } = await db.from('profiles').select('communication_preferences').eq('id', user.id).maybeSingle();
  return <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
    <Link className="inline-flex min-h-11 items-center text-sm underline" href="/app/perfil">← Voltar ao perfil</Link>
    <h1 className="text-2xl font-semibold">Preferências de notificações</h1><p>Esta preferência é salva na sua conta. Ela não ativa envio de e-mails ou notificações push.</p>
    <section className="rounded-2xl border bg-white p-6"><AccountSettingsForm mode="notifications" preferences={readPreferences(data?.communication_preferences)} /></section>
    
  </main>;
}

