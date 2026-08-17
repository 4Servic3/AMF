import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { EditProfileForm } from './edit-profile-form';

export const metadata = {
  title: 'Editar Perfil | AMF',
};

export default async function EditProfilePage() {
  // Simulando fetching de dados atuais para pré-preencher o formulário
  const currentProfile = {
    displayName: 'Dra. Polyana',
    profession: 'Médica-veterinária',
    phone: '(11) 99999-9999',
    initials: 'DR'
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0">
      {/* HEADER SIMPLES */}
      <header className="w-full bg-[#160820] text-white pt-10 sm:pt-14 pb-8 shrink-0">
        <div className="w-full max-w-4xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/app/perfil" className="w-[40px] h-[40px] rounded-full border border-white/20 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B64F]" aria-label="Voltar para Perfil">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </Link>
            <h1 className="text-[20px] font-bold text-white">Editar Perfil</h1>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="w-full flex-1 bg-[#FAF7F1] rounded-t-[28px] -mt-6 relative z-20 flex flex-col min-w-0">
        <main className="w-full max-w-4xl mx-auto px-6 pt-8 pb-20 min-w-0">
          <EditProfileForm initialData={currentProfile} />
        </main>
      </div>
    </div>
  );
}
