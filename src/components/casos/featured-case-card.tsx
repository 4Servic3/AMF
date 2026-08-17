import React from 'react';
import Image from 'next/image';
import { ClinicalJourney } from './clinical-journey';

type FeaturedCaseCardProps = {
  onStartCase: () => void;
};

export function FeaturedCaseCard({ onStartCase }: FeaturedCaseCardProps) {
  return (
    <div className="relative w-full rounded-[18px] md:rounded-[20px] overflow-hidden shadow-lg h-[250px] min-h-[240px] max-h-[300px] group box-border">
      {/* Background Image */}
      <Image
        src="/assets/amf-casos/hero/hero-obstrucao-uretral.webp"
        alt="Obstrução uretral em felino jovem"
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ objectPosition: '70% 30%' }}
        priority
      />
      
      {/* Overlay Gradient Escuro */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(90deg, rgba(4,36,41,1) 0%, rgba(5,38,43,0.95) 45%, rgba(10,35,40,0.6) 65%, transparent 100%)'
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-20 h-full p-[18px] md:p-[24px] flex flex-col justify-between">
        <div className="w-full max-w-[65%] sm:max-w-[60%] flex flex-col min-w-0">
          <div className="font-sans font-bold text-[#D4AD62] text-[10px] tracking-[0.06em] uppercase mb-1.5 shrink-0">
            NOVO CASO
          </div>
          
          <h2 className="font-editorial font-semibold text-white text-[clamp(24px,7vw,32px)] leading-[1.05] mb-1.5 line-clamp-3 min-w-0 break-words whitespace-normal">
            Obstrução uretral em felino jovem
          </h2>
          
          <p className="font-sans text-[12px] sm:text-[14px] text-white/90 mb-3 line-clamp-2 min-w-0 break-words whitespace-normal">
            Do atendimento inicial à alta hospitalar
          </p>

          <p className="font-sans text-[11px] text-white/60 mb-3 md:mb-4 shrink-0">
            Emergência • 4 capítulos
          </p>

          <button 
            onClick={onStartCase}
            className="h-[40px] sm:h-[44px] px-5 sm:px-6 rounded-full bg-[#D4AD62] hover:bg-[#E0C17E] text-[#14091F] font-sans font-bold text-[13px] sm:text-[14px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 w-fit shrink-0"
          >
            Começar caso
          </button>
        </div>

        {/* Clinical Journey at bottom */}
        <div className="w-full max-w-[65%] sm:max-w-[60%] mt-2 shrink-0">
          <ClinicalJourney 
            currentStage="complaint"
            stages={[
              { id: 'complaint', label: 'Queixa' },
              { id: 'exams', label: 'Exames' },
              { id: 'conduct', label: 'Conduta' },
              { id: 'outcome', label: 'Desfecho' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
