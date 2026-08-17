import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Award } from 'lucide-react';

export const metadata = {
  title: 'Certificados | AMF',
};

export default function CertificatesPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0">
      {/* HEADER SIMPLES */}
      <header className="w-full bg-[#160820] text-white pt-10 sm:pt-14 pb-8 shrink-0">
        <div className="w-full max-w-4xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/app/perfil" className="w-[40px] h-[40px] rounded-full border border-white/20 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B64F]" aria-label="Voltar para Perfil">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </Link>
            <h1 className="text-[20px] font-bold text-white">Meus certificados</h1>
          </div>
        </div>
      </header>

      {/* CONTEÚDO (Empty State) */}
      <div className="w-full flex-1 bg-[#FAF7F1] rounded-t-[28px] -mt-6 relative z-20 flex flex-col min-w-0">
        <main className="w-full max-w-4xl mx-auto px-6 pt-16 pb-20 min-w-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#E7B64F]/10 flex items-center justify-center text-[#E7B64F] mb-6">
            <Award size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-[20px] font-editorial text-[#14172A] font-bold mb-2">Nenhum certificado emitido</h2>
          <p className="text-[14px] text-[#657080] text-center max-w-[300px] mb-8">
            Você ainda não possui certificados. Complete cursos para obter as certificações.
          </p>
          <Link href="/app/cursos" className="h-[48px] px-8 rounded-full flex items-center justify-center font-bold text-[14px] text-white bg-[#003D3F] hover:bg-[#0E5B5C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#003D3F]">
            Explorar cursos
          </Link>
        </main>
      </div>
    </div>
  );
}
