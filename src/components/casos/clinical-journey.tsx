import React from 'react';
import type { ClinicalCaseStage } from '@/lib/models/clinical-cases';

type ClinicalJourneyProps = {
  currentStage: ClinicalCaseStage;
  stages: { id: ClinicalCaseStage; label: string }[];
};

export function ClinicalJourney({ currentStage, stages }: ClinicalJourneyProps) {
  // Find current stage index
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  
  return (
    <div className="relative w-full mt-5 mb-2">
      {/* Linha de progresso (background) */}
      <div className="absolute top-[5px] left-0 right-0 h-[2px] bg-white/20" />
      
      {/* Linha de progresso (ativa) */}
      <div 
        className="absolute top-[5px] left-0 h-[2px] bg-[#D4AD62] transition-all duration-300"
        style={{ width: `${currentIndex > 0 ? (currentIndex / (stages.length - 1)) * 100 : 0}%` }}
      />
      
      {/* Marcadores */}
      <div className="relative flex justify-between">
        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isActive = idx === currentIndex;
          
          return (
            <div key={stage.id} className="flex flex-col items-center flex-1 min-w-0">
              {/* Círculo */}
              <div 
                className={`w-[12px] h-[12px] rounded-full border-[2px] flex items-center justify-center z-10 transition-colors
                  ${isCompleted ? 'bg-[#D4AD62] border-[#D4AD62]' : 'bg-[#081E27] border-white/40'}`}
              >
                {isActive && (
                  <div className="w-[4px] h-[4px] rounded-full bg-white" />
                )}
              </div>
              
              {/* Rótulo */}
              <span 
                className={`mt-2 text-[10px] sm:text-[11px] font-sans font-semibold tracking-wider transition-colors min-w-0 max-w-full truncate
                  ${isCompleted ? 'text-[#D4AD62]' : 'text-white/40'}`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
