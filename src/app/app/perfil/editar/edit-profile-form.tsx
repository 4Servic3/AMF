'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { saveProfileAction } from './actions';
import type { ProfileEdit } from '@/lib/member-account-schema';

export function EditProfileForm({ initialData }: { initialData: ProfileEdit }) {
  const [state, action, pending] = useActionState(saveProfileAction, {});
  const field = 'amf-field w-full h-12 px-4 rounded-xl border border-[#DED5C8] bg-white text-[15px] focus-visible:outline-2 focus-visible:outline-[#003D3F]';
  return (
    <form action={action} className="flex flex-col gap-6">
      <p className="text-sm text-[#657080]">Atualize seus dados pessoais. A alteração da foto ainda não está disponível.</p>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">{state.success}</p>}
      <label className="flex flex-col gap-2 text-sm font-semibold">Nome completo<input className={field} name="full_name" autoComplete="name" defaultValue={initialData.full_name} minLength={2} maxLength={120} required /></label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Nome de exibição<input className={field} name="display_name" autoComplete="nickname" defaultValue={initialData.display_name} maxLength={80} /></label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Profissão<select className={field} name="profession" defaultValue={initialData.profession}><option value="veterinarian">Médico-veterinário</option><option value="student">Estudante</option><option value="other">Outra</option></select></label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Telefone<input className={field} name="phone" type="tel" autoComplete="tel" defaultValue={initialData.phone} maxLength={25} /></label>
      <div className="flex flex-wrap justify-end gap-4 border-t border-[#DED5C8] pt-6">
        <Link href="/app/perfil" className="px-5 py-3 font-semibold">Voltar ao perfil</Link>
        <button disabled={pending} className="rounded-full bg-[#003D3F] px-6 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </form>
  );
}
