'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export function GlobalHeader() {
  const pathname = usePathname();

  // Esconder na home premium, Casos, Cursos, Academia e Perfil, pois têm seu próprio cabeçalho escuro integrado
  if (
    pathname === '/app' ||
    pathname === '/app/casos' ||
    pathname.startsWith('/app/cursos') ||
    pathname.startsWith('/app/academia') ||
    pathname.startsWith('/app/perfil')
  ) {
    return null;
  }

  // Título contextual da página
  let title = '';
  if (pathname.includes('/produtos/planilha-doses-seguras-felinos/calculadora')) {
    title = 'Calculadora de Doses';
  } else if (pathname.includes('/produtos/planilha-doses-seguras-felinos')) {
    title = 'Doses Seguras';
  } else if (pathname.startsWith('/app/produtos')) {
    title = 'Produtos';
  } else if (pathname.startsWith('/app/comunidade')) {
    title = 'Comunidade';
  } else if (pathname.startsWith('/app/notificacoes')) {
    title = 'Notificações';
  }

  return (
    <header
      className="w-full text-white border-b border-[#E7B64F]/20 px-6 sticky top-0 z-30 shrink-0"
      style={{
        background: 'linear-gradient(135deg, #1C0D29 0%, #160B24 52%, #081E27 85%)',
        height: '64px',
      }}
    >
      <div className="w-full max-w-4xl mx-auto h-full grid grid-cols-[1fr_auto_1fr] items-center">
        {/* 1. Monograma AMF à esquerda */}
        <Link
          href="/app"
          className="font-editorial text-2xl font-bold text-[#E7B64F] tracking-widest leading-none justify-self-start active:scale-95 transition-transform"
        >
          AMF
        </Link>

        {/* 2. Título Central */}
        <div className="font-sans font-medium text-white/90 text-[15px] justify-self-center truncate max-w-[180px] sm:max-w-none">
          {title}
        </div>

        {/* 3. Slot de Ações à direita */}
        <div className="flex items-center gap-3 justify-self-end">
          <Link
            href="/app/notificacoes"
            className="w-[36px] h-[36px] rounded-full border border-white/20 flex items-center justify-center text-[#E7B64F] hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Notificações"
          >
            <Bell size={18} strokeWidth={1.5} />
          </Link>
          <Link
            href="/app/perfil"
            className="w-[36px] h-[36px] rounded-full bg-[#0E5B5C] border border-[#D4AD62]/30 flex items-center justify-center font-bold text-sm text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
            aria-label="Perfil"
          >
            DR
          </Link>
        </div>
      </div>
    </header>
  );
}
