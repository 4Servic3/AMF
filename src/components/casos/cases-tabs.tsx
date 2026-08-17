'use client';
import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export function CasesTabs() {
  const [activeTab, setActiveTab] = useState<'novos' | 'andamento' | 'salvos'>('novos');

  const tabs = [
    { id: 'novos', label: 'Novos' },
    { id: 'andamento', label: 'Em andamento' },
    { id: 'salvos', label: 'Salvos' },
  ];

  return (
    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto hide-scrollbar min-w-0" role="tablist" aria-label="Filtros de status">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(tab.id as 'novos' | 'andamento' | 'salvos')}
            className="relative flex flex-col items-center justify-center h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] rounded-sm transition-colors shrink-0"
          >
            <span 
              className={`font-sans font-semibold text-[13px] sm:text-[14px] leading-none whitespace-nowrap ${isActive ? 'text-[#D4AD62]' : 'text-[#F9F5EE]'}`}
            >
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute bottom-1 w-[30px] h-[2px] bg-[#D4AD62] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}


