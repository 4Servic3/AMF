import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { readPreferences } from '@/lib/member-preferences';
import AccountSettingsForm from '@/components/auth/account-settings-form';
export const metadata = { title: 'Segurança e privacidade | AMF' };
export default async function Page() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) redirect('/entrar');
  const { data } = await db.from('profiles').select('communication_preferences').eq('id', user.id).maybeSingle();
  return <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
    <Link className="inline-flex min-h-11 items-center text-sm underline" href="/app/perfil">← Voltar ao perfil</Link>
    <h1 className="text-2xl font-semibold">Segurança e privacidade</h1><p>Altere sua senha ou encerre as sessões em outros dispositivos.</p>
    <section className="rounded-2xl border bg-white p-6"><AccountSettingsForm mode="password" preferences={readPreferences(data?.communication_preferences)} /></section>
    <section className="rounded-2xl border bg-white p-6"><AccountSettingsForm mode="sessions" /></section><Link href="/privacidade" className="underline">Política de privacidade</Link>
  </main>;
}

