import React from 'react';
import { LockKeyhole } from 'lucide-react';

export function CloseFriendsArchiveBanner() {
  return (
    <div className="w-full flex justify-center py-4 mb-4">
      <div 
        className="w-full relative overflow-hidden rounded-[16px] p-5 sm:p-6"
        style={{
          background: 'linear-gradient(135deg, #07383C 0%, #062A2E 100%)',
          boxShadow: '0 4px 12px rgba(6, 42, 46, 0.15)'
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col flex-1 min-w-0 w-full">
            <h3 className="font-editorial font-bold text-[20px] sm:text-[22px] text-white leading-tight mb-1 flex items-center gap-2 min-w-0">
              <LockKeyhole size={18} className="text-[#D4AD62] shrink-0" strokeWidth={2.5} />
              <span className="truncate">Acervo Close Friends</span>
            </h3>
            <p className="font-sans text-[13px] sm:text-[14px] text-white/80 min-w-0 break-words whitespace-normal">
              Mais de 80 casos organizados por tema
            </p>
          </div>
          
          <button className="w-full sm:w-auto shrink-0 h-[40px] px-6 rounded-full bg-[#0E5B5C] hover:bg-[#116e6f] border border-[#D4AD62]/30 text-white font-sans font-semibold text-[13px] sm:text-[14px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62]">
            Acessar acervo
          </button>
        </div>
      </div>
    </div>
  );
}
