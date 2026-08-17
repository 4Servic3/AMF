import React from 'react';
import Image from 'next/image';

type ContinueCaseCardProps = {
  onContinue: () => void;
};

export function ContinueCaseCard({ onContinue }: ContinueCaseCardProps) {
  return (
    <div className="w-full flex flex-col pt-2 min-w-0">
      {/* Título da Seção */}
      <h2 className="font-editorial font-bold text-[27px] md:text-[31px] text-[#172638] leading-none mb-1">
        Continue de onde parou
      </h2>
      
      {/* Underline petrol curto */}
      <div className="w-[40px] h-[3px] bg-[#0E5B5C] rounded-full mb-5" />

      {/* Card Horizontal usando CSS Grid */}
      <button 
        onClick={onContinue}
        className="w-full grid grid-cols-[minmax(112px,36%)_minmax(0,1fr)] sm:grid-cols-[minmax(130px,30%)_minmax(0,1fr)] rounded-[16px] overflow-hidden bg-white shadow-sm border border-[#D9D1C4] text-left hover:border-[#D4AD62] hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62]"
      >
        {/* Imagem */}
        <div className="relative w-full h-[120px] sm:h-[130px] min-w-0">
          <Image
            src="/assets/amf-casos/stories/story-drc.webp"
            alt="Doença renal crônica"
            fill
            className="object-cover"
            style={{ objectPosition: '50% 58%' }}
          />
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col justify-between w-full h-full p-3 md:p-4 min-w-0">
          <div className="min-w-0">
            <div className="font-sans font-bold text-[#68727E] text-[10px] uppercase tracking-wider mb-1 truncate">
              DRC
            </div>
            <h3 className="font-sans font-bold text-[#172638] text-[14px] md:text-[16px] leading-tight line-clamp-2 md:line-clamp-3 min-w-0 break-words whitespace-normal overflow-wrap-anywhere">
              Doença renal crônica: estágio 2
            </h3>
          </div>

          <div className="mt-2 min-w-0">
            <div className="flex justify-between items-center mb-1.5 gap-2">
              <span className="font-sans font-medium text-[#68727E] text-[11px] truncate">
                3 de 5 etapas • 60%
              </span>
              <span className="font-sans font-semibold text-[#0E5B5C] text-[12px] shrink-0">
                Continuar
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-[4px] bg-[#EDE5D8] rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-[#59BFAE] rounded-full transition-all" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
