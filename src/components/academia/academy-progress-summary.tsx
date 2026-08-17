import React from 'react';

interface AcademyProgressSummaryProps {
  percentage: number;
  currentPhase: number;
  totalPhases: number;
  weeksRemaining: number;
}

export function AcademyProgressSummary({
  percentage,
  currentPhase,
  totalPhases,
  weeksRemaining
}: AcademyProgressSummaryProps) {
  return (
    <div className="bg-[#FFFDFC] rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-full relative z-20">
      <div className="flex flex-col">
        <span className="font-editorial text-[#10162F] font-bold text-[18px]">
          Formação AMF
        </span>
        
        <div className="flex items-end justify-between mt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-[#006B68] text-[42px] leading-none font-bold tracking-tight">
              {percentage}%
            </span>
            <span className="font-sans text-[#10162F] font-semibold text-[15px]">
              concluída
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="font-sans text-[#10162F] font-bold text-[15px]">
              Fase {currentPhase} de {totalPhases}
            </span>
            <span className="font-sans text-[#667085] text-[13px] mt-0.5">
              {weeksRemaining} semanas restantes
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[#E6E0D8] rounded-full mt-5 overflow-hidden">
          <div 
            className="h-full bg-[#006B68] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
