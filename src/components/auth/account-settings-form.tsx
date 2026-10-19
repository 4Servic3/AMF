'use client';
import { useActionState } from 'react';
import { changeMemberPassword, signOutOtherSessions, saveNotificationPreferences, saveAccessibilityPreferences } from '@/app/app/perfil/account-actions';
import type { readPreferences } from '@/lib/member-preferences';
type Preferences = ReturnType<typeof readPreferences>;
export default function AccountSettingsForm({ mode, preferences }: { mode: 'password' | 'sessions' | 'notifications' | 'accessibility'; preferences?: Preferences }) {
  const actions = { password: changeMemberPassword, sessions: signOutOtherSessions, notifications: saveNotificationPreferences, accessibility: saveAccessibilityPreferences };
  const [state, action, pending] = useActionState(actions[mode], null);
  const labels = { password: 'Alterar senha', sessions: 'Encerrar outras sessões', notifications: 'Salvar preferências', accessibility: 'Salvar preferências' };
  return <form action={action} className="space-y-4">
    {mode === 'password' && <>{[{ name: 'current', label: 'Senha atual', complete: 'current-password' }, { name: 'password', label: 'Nova senha (mínimo 8 caracteres)', complete: 'new-password' }, { name: 'confirmation', label: 'Repita a nova senha', complete: 'new-password' }].map(field => <label key={field.name} className="block space-y-1"><span>{field.label}</span><input className="w-full rounded-lg border p-3" name={field.name} type="password" autoComplete={field.complete} required maxLength={128} minLength={field.name === 'current' ? 1 : 8} /></label>)}</>}
    {mode === 'notifications' && <label className="flex gap-3"><input type="checkbox" name="email_notifications" defaultChecked={preferences?.email_notifications} /><span>Quero receber novidades por e-mail quando esse canal estiver disponível.</span></label>}
    {mode === 'accessibility' && <><label className="flex gap-3"><input type="checkbox" name="large_text" defaultChecked={preferences?.accessibility.large_text} /><span>Ampliar textos de leitura</span></label><label className="flex gap-3"><input type="checkbox" name="reduce_motion" defaultChecked={preferences?.accessibility.reduce_motion} /><span>Reduzir animações</span></label></>}
    {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    {state?.message && <p role="status" className="text-sm text-[#1F5F54]">{state.message}</p>}
    <button disabled={pending} className="min-h-11 rounded-lg bg-[#1F5F54] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Salvando…' : labels[mode]}</button>
  </form>;
}

