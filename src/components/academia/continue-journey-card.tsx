'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';

interface ContinueJourneyCardProps {
  title: string;
  moduleInfo: string;
  durationMin: number;
  imageUrl: string;
  href?: string;
}

export function ContinueJourneyCard({
  title,
  moduleInfo,
  durationMin,
  imageUrl,
  href = '#'
}: ContinueJourneyCardProps) {
  return (
    <div className="w-full rounded-[24px] overflow-hidden relative shadow-lg mt-6 min-h-[220px] sm:min-h-[240px] flex flex-col justify-end group">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-[#0B1A24]">
        <Image 
          src={imageUrl} 
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover object-right sm:object-[80%_center] opacity-90 transition-transform duration-700 group-hover:scale-105"
        />
        {/* Dark gradient for text readability, matches the dark teal/petroleum vibe in the design */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1A24] via-[#0B1A24]/90 sm:via-[#0B1A24]/70 to-transparent" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 flex flex-col items-start w-full max-w-[90%] sm:max-w-[70%]">
        <span className="font-sans font-bold text-[#D6A63E] text-[11px] tracking-widest uppercase mb-3 drop-shadow-md">
          Continue sua jornada
        </span>
        
        <h2 className="font-editorial text-white text-[28px] sm:text-[36px] leading-tight font-bold mb-2 drop-shadow-md">
          {title}
        </h2>
        
        <div className="flex items-center gap-2 font-sans text-white text-[14px] sm:text-[15px] mb-5 drop-shadow-sm">
          <span>{moduleInfo}</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-white bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
            <Clock size={14} strokeWidth={2} className="text-[#D6A63E]" />
            <span className="font-sans text-[13px] font-medium">{durationMin} min</span>
          </div>
        </div>

        <Link 
          href={href}
          className="bg-[#D6A63E] hover:bg-[#E8BD5A] active:scale-95 transition-all duration-200 text-[#10162F] font-sans font-bold text-[15px] px-6 py-3 rounded-full flex items-center justify-center min-w-[160px] shadow-[0_4px_12px_rgba(214,166,62,0.3)] hover:shadow-[0_6px_16px_rgba(214,166,62,0.4)]"
          onClick={(e) => {
            // Impedir clique duplo
            if (e.currentTarget.dataset.clicking === 'true') {
              e.preventDefault();
            } else {
              e.currentTarget.dataset.clicking = 'true';
              setTimeout(() => {
                if (e.currentTarget) e.currentTarget.dataset.clicking = 'false';
              }, 1000);
            }
          }}
        >
          Continuar aula
        </Link>
      </div>
    </div>
  );
}
