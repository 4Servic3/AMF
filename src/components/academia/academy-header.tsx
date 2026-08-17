import React from 'react';
import { Bell } from 'lucide-react';

export function AcademyHeader() {
  return (
    <div className="relative w-full pt-[env(safe-area-inset-top,0px)] px-4 sm:px-6 pt-10 pb-[64px]">
      
      {/* Top Bar Area */}
      <div className="flex items-center justify-between mb-10 relative z-20">
        <div className="font-editorial text-[#D6A63E] text-[22px] font-bold tracking-widest">
          AMF
        </div>
        <div className="font-sans text-white font-semibold text-[17px] text-center absolute left-1/2 -translate-x-1/2">
          Academia
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="w-10 h-10 rounded-full border border-[#D6A63E]/30 flex items-center justify-center text-[#D6A63E] transition-colors hover:bg-[#D6A63E]/10 active:scale-95"
            aria-label="Notificações"
          >
            <Bell size={18} strokeWidth={1.5} />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#006B68] flex items-center justify-center text-white font-sans font-bold text-[13px] tracking-wide shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
            DR
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="flex flex-col gap-1 relative z-10">
        <span className="font-sans text-[#D4C5D9] text-[14px]">Olá, Dra. Polyana</span>
        <h1 className="font-editorial text-white text-[38px] sm:text-[44px] leading-[1.1] font-bold mt-1">
          Sua jornada clínica
        </h1>
        <p className="font-sans text-[#D4C5D9] text-[15px] mt-2 max-w-[280px] sm:max-w-none">
          Aprenda na ordem certa, do fundamento à prática.
        </p>
      </div>
    </div>
  );
}
