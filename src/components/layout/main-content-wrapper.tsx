'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // A página /app (Home), /app/casos, /app/cursos, /app/academia e /app/perfil assumem controle total das margens e paddings
  if (pathname === '/app' || pathname === '/app/casos' || pathname.startsWith('/app/cursos') || pathname.startsWith('/app/academia') || pathname.startsWith('/app/perfil')) {
    return <main className="flex-1 min-w-0">{children}</main>;
  }

  // Demais páginas usam o padding padrão (sem padding bottom para não duplicar com o app-main)
  return <main className="flex-1 px-6 pt-6 md:p-6 min-w-0">{children}</main>;
}
