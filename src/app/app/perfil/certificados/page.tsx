import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Award, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Certificados | AMF',
};

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  let certificates: any[] = [];
  if (session) {
    const { data } = await supabase
      .from('certificates')
      .select('*, courses(title)')
      .eq('profile_id', session.user.id)
      .eq('status', 'active')
      .order('issue_date', { ascending: false });
    
    if (data) {
      certificates = data;
    }
  }

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

      {/* CONTEÚDO */}
      <div className="w-full flex-1 bg-[#FAF7F1] rounded-t-[28px] -mt-6 relative z-20 flex flex-col min-w-0">
        <main className="w-full max-w-4xl mx-auto px-6 pt-16 pb-20 min-w-0 flex flex-col">
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full">
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
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-[#D4AD62]" />
                  <Award className="w-12 h-12 text-[#160820] mb-4" strokeWidth={1.5} />
                  <h3 className="font-editorial text-xl font-bold text-[#160820] mb-2">{cert.courses?.title || cert.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 font-medium">Emitido em: {new Date(cert.issue_date).toLocaleDateString('pt-BR')}</p>
                  <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 px-3 py-1 rounded">Cód: {cert.validation_code}</p>
                  
                  <button className="w-full flex items-center justify-center gap-2 border-2 border-[#160820] text-[#160820] rounded-full py-3 font-bold hover:bg-[#160820] hover:text-white transition-colors">
                    <Download size={18} />
                    Baixar PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
