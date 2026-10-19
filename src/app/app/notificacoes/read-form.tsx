
'use client';
import { useActionState } from 'react';
import { markReadAction } from './actions';
export function ReadNotificationsForm({ ids }: { ids: string[] }) {
  const [state, action, pending] = useActionState(markReadAction, {});
  return <form action={action} className="space-y-2">
    {ids.map(id => <input key={id} type="hidden" name="notification" value={id} />)}
    <button disabled={pending || !ids.length} className="min-h-11 rounded-xl bg-[#003D3F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Salvando…' : 'Marcar esta página como lida'}</button>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-[#003D3F]">{state.success}</p>}
  </form>;
}
