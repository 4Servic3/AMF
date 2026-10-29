'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headset, LoaderCircle, SendHorizontal, X } from 'lucide-react';
import { loadSupportBubble, sendSupportBubbleReply, type SupportBubbleData } from '@/app/app/perfil/suporte/actions';
import { bubbleState } from '@/lib/support-bubble-state';

const DISMISSED = 'amf-support-bubble-dismissed';
const SEEN = 'amf-support-bubble-seen';
const read = (key: string) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* sem armazenamento: o botão só reaparece */ } };

/** Telas onde o botão atrapalharia: o próprio suporte e a aula aberta. */
const hiddenOn = (path: string) => path.startsWith('/app/perfil/suporte') || /^\/app\/cursos\/[^/]+\/aula\//.test(path);

/**
 * Botão flutuante com fone: aparece enquanto há um chamado aberto, mostra a conversa e deixa responder.
 * "Ocultar" esconde até chegar uma mensagem nova.
 */
export function SupportBubble() {
  const pathname = usePathname();
  const [data, setData] = useState<SupportBubbleData>(null);
  const [open, setOpen] = useState(false);
  const [marks, setMarks] = useState({ dismissed: '', seen: '' });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const list = useRef<HTMLOListElement>(null);

  const refresh = useCallback(async () => {
    if (document.hidden) return;
    setData(await loadSupportBubble());
  }, []);

  useEffect(() => { setMarks({ dismissed: read(DISMISSED), seen: read(SEEN) }); }, []);
  useEffect(() => {
    if (hiddenOn(pathname)) return;
    refresh();
    const timer = setInterval(refresh, open ? 20_000 : 60_000);
    return () => clearInterval(timer);
  }, [pathname, open, refresh]);

  const state = bubbleState(data, marks);
  useEffect(() => {
    if (!open || !state.key) return;
    write(SEEN, state.key);
    setMarks((m) => ({ ...m, seen: state.key }));
    list.current?.lastElementChild?.scrollIntoView({ block: 'end' });
  }, [open, state.key]);

  if (hiddenOn(pathname) || !data || !state.visible) return null;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!data || sending || !text.trim()) return;
    setSending(true);
    setFeedback('');
    const result = await sendSupportBubbleReply(data.ticket.id, text);
    setSending(false);
    if (result.error) { setFeedback(result.error); return; }
    setText('');
    await refresh();
  }

  function hide() {
    write(DISMISSED, state.key);
    setMarks((m) => ({ ...m, dismissed: state.key }));
    setOpen(false);
  }

  return (
    <div className="amf-support-bubble fixed right-4 z-[60] flex flex-col items-end gap-3 lg:right-8" style={{ bottom: 'calc(var(--amf-bottom-nav-outer-height, 0px) + 16px)' }}>
      {open && (
        <section role="dialog" aria-label="Conversa com o suporte" className="flex max-h-[min(560px,calc(100dvh-180px))] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-[#E8DFD2] bg-white shadow-[0_18px_48px_rgba(22,11,36,0.28)]">
          <header className="flex items-start justify-between gap-3 bg-[#160B24] px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#E0C17E]">Suporte AMF</p>
              <p className="truncate text-sm font-semibold">{data.ticket.subject}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar conversa" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
          </header>
          <ol ref={list} className="flex-1 space-y-2 overflow-y-auto bg-[#FAF7F1] px-3 py-3">
            {data.messages.map((m) => (
              <li key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.own ? 'ml-auto bg-[#0E5B5C] text-white' : 'bg-white text-[#14172A] shadow-sm'}`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] ${m.own ? 'text-white/70' : 'text-[#657080]'}`}>{m.own ? 'Você' : 'Equipe AMF'} · {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              </li>
            ))}
          </ol>
          <form onSubmit={send} className="border-t border-[#E8DFD2] p-3">
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="support-bubble-text">Sua mensagem</label>
              <textarea id="support-bubble-text" value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={5000} placeholder="Escreva sua mensagem" className="min-h-11 flex-1 resize-none rounded-2xl border border-[#DED5C8] px-3 py-2 text-sm outline-none focus:border-[#0E5B5C]" />
              <button type="submit" disabled={sending || !text.trim()} aria-label="Enviar mensagem" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0E5B5C] text-white disabled:opacity-50">
                {sending ? <LoaderCircle size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
              </button>
            </div>
            {feedback && <p role="alert" className="mt-2 text-xs text-[#B42318]">{feedback}</p>}
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <Link href={`/app/perfil/suporte/${data.ticket.id}`} onClick={() => setOpen(false)} className="text-[#0E5B5C] underline underline-offset-2">Abrir conversa completa</Link>
              <button type="button" onClick={hide} className="text-[#657080] hover:text-[#14172A]">Ocultar esta conversa</button>
            </div>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={state.unread ? 'Suporte: nova resposta da equipe' : 'Abrir conversa com o suporte'}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#160B24] text-[#E0C17E] shadow-[0_10px_28px_rgba(22,11,36,0.35)] ring-1 ring-[#E0C17E]/40 transition-transform hover:scale-105"
      >
        <Headset size={24} aria-hidden="true" />
        {state.unread && <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-[#160B24] bg-[#E0C17E]" />}
      </button>
    </div>
  );
}
