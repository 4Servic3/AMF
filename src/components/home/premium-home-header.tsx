import React from 'react';
import { Bell } from 'lucide-react';
import { PremiumPageHeader } from '@/components/layout/premium-page-header';

export function PremiumHomeHeader({ children }: { children: React.ReactNode }) {
  const rightSlot = (
    <>
      <button 
        className="w-[42px] h-[42px] sm:w-[44px] sm:h-[44px] shrink-0 flex items-center justify-center rounded-full text-[#D4AD62] border border-[#D4AD62]/30 hover:bg-[#D4AD62]/10 transition-colors focus:outline-none" 
        aria-label="Notificações"
      >
        <Bell size={22} strokeWidth={1.5} />
      </button>
      
      <button className="w-[40px] h-[40px] sm:w-[42px] sm:h-[42px] shrink-0 rounded-full bg-[#075255] border border-[#D4AD62]/30 flex items-center justify-center text-white text-[13px] sm:text-[14px] font-bold shadow-md hover:opacity-90 focus:outline-none" aria-label="Perfil">
        DR
      </button>
    </>
  );

  return (
    <PremiumPageHeader title="Início" rightSlot={rightSlot}>
      {children}
    </PremiumPageHeader>
  );
}
