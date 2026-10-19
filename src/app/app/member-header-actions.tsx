'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, ChevronRight, LoaderCircle, UserRound } from 'lucide-react';
import { LogoutButton } from './perfil/logout-button';
import { loadNotificationPreview, markNotificationPreviewRead } from './notificacoes/actions';

type Notice = { id: string; title: string; message: string; target_url: string | null; created_at: string; read: boolean };
type Menu = 'notifications' | 'profile' | null;

export function MemberHeaderActions({ compact = false }: { compact?: boolean }) {
  const [menu, setMenu] = useState<Menu>(null);
  const [items, setItems] = useState<Notice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setMenu(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenu(null);
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    setLoadError(false);
    const result = await loadNotificationPreview();
    if (result.error) setLoadError(true);
    else setItems(result.items);
    setLoading(false);
  }

  async function toggleNotifications() {
    if (menu === 'notifications') { setMenu(null); return; }
    setMenu('notifications');
    if (items !== null || loading) return;
    await fetchNotifications();
  }

  async function openNotice(notice: Notice) {
    if (!notice.read) {
      try { await markNotificationPreviewRead(notice.id); }
      catch { /* A navegação continua; a tela completa permite tentar marcar novamente. */ }
    }
    setMenu(null);
    router.push(notice.target_url || '/app/notificacoes');
  }

  const buttonSize = compact ? 'h-10 w-10' : 'h-11 w-11';
  const buttonClass = `${buttonSize} flex shrink-0 items-center justify-center rounded-full border border-[#D4AD62]/30 text-[#D4AD62] transition-colors hover:bg-[#D4AD62]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E7B64F]`;

  return (
    <div ref={root} className="relative flex items-center gap-2" aria-label="Ações da conta">
      <div className="relative">
        <button type="button" className={buttonClass} aria-label="Notificações" aria-expanded={menu === 'notifications'} aria-controls="member-notifications-popover" onClick={toggleNotifications}>
          <Bell size={compact ? 18 : 21} strokeWidth={1.6} />
          {items?.some(item => !item.read) && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-[#160820] bg-[#E7B64F]" aria-label="Há notificações não lidas" />}
        </button>
        {menu === 'notifications' && (
          <section id="member-notifications-popover" aria-label="Notificações recentes" className="absolute right-0 top-[calc(100%+12px)] z-[100] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#DED5C8] bg-white text-left text-[#160820] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EEE8DE] px-4 py-3">
              <h2 className="font-semibold">Notificações</h2>
              <Link href="/app/notificacoes" onClick={() => setMenu(null)} className="text-xs font-semibold text-[#0E5B5C] underline underline-offset-2">Ver todas</Link>
            </div>
            {loading ? <p className="flex items-center gap-2 px-4 py-5 text-sm text-[#657080]" role="status"><LoaderCircle size={16} className="animate-spin" />Carregando…</p>
              : loadError ? <div className="px-4 py-5"><p className="text-sm text-[#657080]" role="alert">Não foi possível carregar as notificações.</p><button type="button" onClick={() => void fetchNotifications()} className="mt-2 text-sm font-semibold text-[#0E5B5C] underline">Tentar novamente</button></div>
                : !items?.length ? <p className="px-4 py-6 text-center text-sm text-[#657080]">Nenhuma notificação</p>
                  : <ul className="max-h-80 overflow-y-auto divide-y divide-[#EEE8DE]">{items.map(item => <li key={item.id}>
                    <button type="button" onClick={() => void openNotice(item)} className="block min-h-16 w-full px-4 py-3 text-left hover:bg-[#FAF7F1] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0E5B5C]">
                      <span className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-[#D4AD62]'}`} />{item.title}</span>
                      <span className="mt-1 block line-clamp-2 text-xs text-[#657080]">{item.message}</span>
                    </button>
                  </li>)}</ul>}
          </section>
        )}
      </div>
      <div className="relative">
        <button type="button" className={`${buttonSize} flex shrink-0 items-center justify-center rounded-full border border-[#D4AD62]/30 bg-[#075255] text-white transition-colors hover:bg-[#0E5B5C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E7B64F]`} aria-label="Perfil" aria-expanded={menu === 'profile'} aria-controls="member-profile-popover" onClick={() => setMenu(menu === 'profile' ? null : 'profile')}>
          <UserRound size={compact ? 18 : 20} aria-hidden="true" />
        </button>
        {menu === 'profile' && <nav id="member-profile-popover" aria-label="Menu do perfil" className="absolute right-0 top-[calc(100%+12px)] z-[100] w-56 overflow-hidden rounded-2xl border border-[#DED5C8] bg-white py-2 text-[#160820] shadow-xl">
          <Link href="/app/perfil" onClick={() => setMenu(null)} className="flex min-h-11 items-center justify-between px-4 text-sm hover:bg-[#FAF7F1] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0E5B5C]">Meu perfil <ChevronRight size={16} /></Link>
          <Link href="/app/perfil/editar" onClick={() => setMenu(null)} className="flex min-h-11 items-center justify-between px-4 text-sm hover:bg-[#FAF7F1] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0E5B5C]">Dados pessoais <ChevronRight size={16} /></Link>
          <Link href="/app/perfil/seguranca" onClick={() => setMenu(null)} className="flex min-h-11 items-center justify-between px-4 text-sm hover:bg-[#FAF7F1] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0E5B5C]">Segurança <ChevronRight size={16} /></Link>
          <div className="mt-1 border-t border-[#EEE8DE] pt-1"><LogoutButton /></div>
        </nav>}
      </div>
    </div>
  );
}
