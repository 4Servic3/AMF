import React from 'react';
import { RecentCaseCard } from './recent-case-card';

type RecentCasesFeedProps = {
  onOpenCase: (id: string) => void;
};

export function RecentCasesFeed({ onOpenCase }: RecentCasesFeedProps) {
  return (
    <div className="w-full flex flex-col pt-4 pb-6">
      <h2 className="font-editorial font-bold text-[22px] md:text-[25px] text-[#172638] leading-none mb-4">
        Casos recentes
      </h2>
      
      <div className="flex flex-col gap-3 sm:gap-4">
        <RecentCaseCard 
          imageUrl="/assets/amf-casos/stories/story-felv.webp"
          category="FeLV"
          title="Anemia grave em paciente FeLV positivo"
          metadata="12 min • Publicado hoje"
          status="new"
          onOpenCase={() => onOpenCase('felv')}
        />
        
        <RecentCaseCard 
          imageUrl="/assets/amf-casos/stories/story-diagnostico.webp"
          category="Diagnóstico"
          title="Perda de peso progressiva"
          metadata="14 min • Ontem"
          hasBookmark
          onOpenCase={() => onOpenCase('diagnostico')}
        />
      </div>
    </div>
  );
}
