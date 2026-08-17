import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export function CasesFilterButton() {
  return (
    <button
      className="flex items-center justify-center h-[44px] px-3 sm:px-4 rounded-full border border-[#D4AD62] text-[#D4AD62] hover:bg-[#D4AD62]/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] gap-1.5 sm:gap-2 font-sans font-semibold text-[13px] sm:text-[14px] shrink-0"
      aria-label="Filtros"
      aria-haspopup="dialog"
    >
      <SlidersHorizontal size={18} strokeWidth={2} />
      <span className="hidden sm:inline">Filtros</span>
    </button>
  );
}
