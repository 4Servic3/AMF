import React from 'react';
import { Search } from 'lucide-react';
import { PremiumPageHeader } from '@/components/layout/premium-page-header';

export function CasesPremiumHeader({ children }: { children?: React.ReactNode }) {
  const rightSlot = (
    <>
      <button 
        className="w-[42px] h-[42px] sm:w-[44px] sm:h-[44px] shrink-0 flex items-center justify-center rounded-full text-[#D4AD62] border border-[#D4AD62]/30 hover:bg-[#D4AD62]/10 transition-colors focus:outline-none" 
        aria-label="Buscar casos"
      >
        <Search size={22} strokeWidth={1.5} />
      </button>
      
      <button className="w-[40px] h-[40px] sm:w-[42px] sm:h-[42px] shrink-0 rounded-full bg-[#075255] border border-[#D4AD62]/30 flex items-center justify-center text-white text-[13px] sm:text-[14px] font-bold shadow-md hover:opacity-90 focus:outline-none" aria-label="Perfil">
        DR
      </button>
    </>
  );

  return (
    <PremiumPageHeader title="Casos" rightSlot={rightSlot}>
      {/* Títulos */}
      <div className="casesSectionInner relative z-10 mt-[26px]">
        <h1 className="font-editorial font-semibold text-[31px] md:text-[36px] text-[#F9F5EE] leading-none mb-2 min-w-0 break-words whitespace-normal">
          Casos da semana
        </h1>
        <p className="font-sans font-normal text-[13px] md:text-[15px] text-white/82 leading-snug line-clamp-2 md:line-clamp-none max-w-[280px] md:max-w-md min-w-0 break-words whitespace-normal">
          Novos raciocínios clínicos publicados duas vezes por semana
        </p>
      </div>

      {/* Slots adicionais (Tabs, Hero) */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </PremiumPageHeader>
  );
}
