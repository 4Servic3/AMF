import React from 'react';
import { ChevronRight, Award } from 'lucide-react';

interface NextMilestoneCardProps {
  title: string;
}

export function NextMilestoneCard({ title }: NextMilestoneCardProps) {
  return (
    <div className="w-full mt-6 mb-12 sm:mb-16">
      <div className="bg-[#FFFDFC] border border-[#DED5C9] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm cursor-pointer hover:bg-[#FBF7F0] transition-colors group">
        
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 border border-[#DED5C9] shadow-sm relative overflow-hidden">
            {/* Sunburst background effect around the medal */}
            <div className="absolute inset-0 bg-[#D6A63E]/10" />
            <Award size={24} strokeWidth={2} className="text-[#D6A63E] relative z-10" />
          </div>
          
          <div className="flex flex-col">
            <span className="font-sans text-[11px] font-bold text-[#D6A63E] uppercase tracking-widest mb-0.5">
              Próximo marco
            </span>
            <span className="font-sans font-bold text-[#10162F] text-[14px] sm:text-[15px] leading-tight pr-2">
              {title}
            </span>
          </div>
        </div>

        <div className="text-[#667085] group-hover:text-[#10162F] transition-colors">
          <ChevronRight size={24} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
