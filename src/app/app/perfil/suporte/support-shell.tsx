import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export function SupportShell({ children, backHref = '/app/perfil', title = 'Ajuda e suporte' }: { children: ReactNode; backHref?: string; title?: string }) {
  return <div className="flex min-h-screen w-full min-w-0 flex-col bg-[#FAF7F1]">
    <header className="amf-member-header w-full shrink-0 bg-[#160820] pb-8 pt-10 text-white sm:pt-14"><div className="mx-auto w-full max-w-4xl px-6"><div className="mb-2 flex items-center gap-4">
      <Link href={backHref} aria-label="Voltar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 focus-visible:outline-2 focus-visible:outline-[#E7B64F]"><ChevronLeft size={20} /></Link>
      <h1 className="amf-page-heading text-xl font-bold text-white">{title}</h1>
    </div></div></header>
    <main className="relative z-20 mx-auto -mt-6 w-full max-w-4xl flex-1 rounded-t-[28px] bg-[#FAF7F1] px-6 pb-20 pt-8">{children}</main>
  </div>;
}
