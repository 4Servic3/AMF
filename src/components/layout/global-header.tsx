'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function GlobalHeader() {
  const pathname = usePathname();

  // Esconder na home premium, Casos, Cursos, Academia e Perfil, pois têm seu próprio cabeçalho escuro integrado
  if (pathname === '/app' || pathname === '/app/casos' || pathname.startsWith('/app/cursos') || pathname.startsWith('/app/academia') || pathname.startsWith('/app/perfil')) {
    return null;
  }

  return (
    <header className="h-16 border-b border-(--color-amf-border) bg-white/50 backdrop-blur flex items-center px-6 justify-between sticky top-0 z-20">
      <div className="font-editorial text-lg text-(--color-amf-plum) md:hidden font-bold">AMF</div>
      <div className="hidden md:block text-sm font-medium text-(--color-amf-muted)">
        Bem-vinda, Dra.
      </div>
      <div className="w-8 h-8 rounded-full bg-(--color-amf-teal) flex items-center justify-center text-white text-xs font-bold">
        DR
      </div>
    </header>
  );
}
