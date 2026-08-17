import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Segurança | AMF',
};

export default function SegurancaPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0">
      <header className="w-full bg-[#160820] text-white pt-10 sm:pt-14 pb-8 shrink-0">
        <div className="w-full max-w-4xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/app/perfil" className="w-[40px] h-[40px] rounded-full border border-white/20 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B64F]" aria-label="Voltar para Perfil">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </Link>
            <h1 className="text-[20px] font-bold text-white">Segurança</h1>
          </div>
        </div>
      </header>
      <div className="w-full flex-1 bg-[#FAF7F1] rounded-t-[28px] -mt-6 relative z-20 flex flex-col min-w-0">
        <main className="w-full max-w-4xl mx-auto px-6 pt-16 pb-20 min-w-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-[#003D3F] mb-6">
            <ShieldAlert size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-[20px] font-editorial text-[#14172A] font-bold mb-2">Segurança e Privacidade</h2>
          <p className="text-[14px] text-[#657080] text-center max-w-[300px]">Área para configurar senhas, MFA e sessões.</p>
        </main>
      </div>
    </div>
  );
}
