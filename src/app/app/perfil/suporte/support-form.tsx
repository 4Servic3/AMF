'use client';
import { useActionState } from 'react';
import { createTicketAction, replyTicketAction } from './actions';
import { ticketCategories } from '@/lib/member-account-schema';

export function SupportForm({ ticketId }: { ticketId?: string }) {
  const [state, action, pending] = useActionState(ticketId ? replyTicketAction : createTicketAction, {});
  const field = 'amf-field w-full rounded-xl border border-[#DED5C8] bg-white p-3 text-base focus-visible:outline-2 focus-visible:outline-[#003D3F]';
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{state.success}</p>}
      {ticketId ? <input type="hidden" name="ticketId" value={ticketId} /> : <>
        <label className="flex flex-col gap-2 text-sm font-semibold">Assunto<input name="subject" className={field} minLength={3} maxLength={160} required /></label>
        <label className="flex flex-col gap-2 text-sm font-semibold">Categoria<select name="category" className={field} defaultValue="general">{Object.entries(ticketCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </>}
      <label className="flex flex-col gap-2 text-sm font-semibold">Mensagem<textarea name="content" className={`${field} min-h-36 resize-y`} maxLength={5000} required aria-describedby="support-message-help" /></label>
      <p id="support-message-help" className="text-xs text-[#657080]">Até 5.000 caracteres. Não envie senhas ou dados de pagamento.</p>
      <button disabled={pending} className="self-start rounded-full bg-[#003D3F] px-6 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Enviando…' : ticketId ? 'Enviar mensagem' : 'Abrir chamado'}</button>
    </form>
  );
}
