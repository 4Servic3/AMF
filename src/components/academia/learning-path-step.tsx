import React from 'react';
import { Check, Lock, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export type StepStatus = 'completed' | 'current' | 'locked' | 'milestone';

export interface LearningPathStepProps {
  number: number;
  title: string;
  subtitle: string;
  status: StepStatus;
  progressPercent?: number; // for current status
  isLast?: boolean;
  href?: string;
}

export function LearningPathStep({
  number,
  title,
  subtitle,
  status,
  progressPercent,
  isLast,
  href = '#'
}: LearningPathStepProps) {
  
  // Design details for each status
  const getStatusStyles = () => {
    switch(status) {
      case 'completed':
        return {
          containerBorder: 'border-transparent',
          circleBg: 'bg-[#004F4D]',
          circleBorder: 'border-[#004F4D]',
          circleText: 'text-white',
          titleColor: 'text-[#10162F]',
          subtitleColor: 'text-[#004F4D]',
          lineColor: 'bg-[#004F4D]',
          lineStyle: 'solid'
        };
      case 'current':
        return {
          containerBorder: 'border-[#DED5C9]',
          containerBg: 'bg-[#FFFDFC]',
          circleBg: 'bg-[#004F4D]',
          circleBorder: 'border-[#D6A63E]',
          circleText: 'text-white',
          titleColor: 'text-[#10162F]',
          subtitleColor: 'text-[#667085]',
          lineColor: 'bg-[#004F4D]', // or dashed? the prompt said "linha vertical conectando marcos. Trecho futuro em dourado/cinza discreto" -- so the line FROM current TO next should be dashed or gray
          lineStyle: 'dashed'
        };
      case 'locked':
        return {
          containerBorder: 'border-transparent',
          circleBg: 'bg-transparent',
          circleBorder: 'border-[#DED5C9]',
          circleText: 'text-[#A0AAB5]',
          titleColor: 'text-[#10162F]',
          subtitleColor: 'text-[#667085]',
          lineColor: 'bg-[#DED5C9]',
          lineStyle: 'dashed'
        };
      case 'milestone':
        return {
          containerBorder: 'border-transparent',
          circleBg: 'bg-[#FBF7F0]',
          circleBorder: 'border-[#D6A63E]',
          circleText: 'text-[#D6A63E]',
          titleColor: 'text-[#10162F]',
          subtitleColor: 'text-[#667085]',
          lineColor: 'bg-transparent',
          lineStyle: 'none'
        };
    }
  };

  const styles = getStatusStyles();
  const isCurrent = status === 'current';

  return (
    <div className={`relative flex w-full items-stretch ${isCurrent ? 'mb-4' : 'mb-2'}`}>
      
      {/* Coluna fixa da Timeline */}
      <div className="w-[40px] sm:w-[48px] shrink-0 flex flex-col items-center relative">
        {/* Circle */}
        <div className={`w-10 h-10 rounded-full border-[2px] flex items-center justify-center relative bg-white z-10 ${styles.circleBorder} ${isCurrent ? 'mt-3' : 'mt-0'}`}>
          <div className={`w-full h-full rounded-full flex items-center justify-center ${styles.circleBg} ${isCurrent ? 'border-[2px] border-white' : ''}`}>
            {status === 'completed' ? (
              <Check size={18} strokeWidth={2.5} className="text-white" />
            ) : status === 'locked' ? (
              <Lock size={16} strokeWidth={2} className="text-[#A0AAB5]" />
            ) : status === 'milestone' ? (
              <Award size={18} strokeWidth={2} className="text-[#D6A63E]" />
            ) : (
              <span className={`font-editorial font-bold text-[18px] ${styles.circleText}`}>
                {number}
              </span>
            )}
          </div>
        </div>

        {/* Timeline Line conectando ao próximo (se não for último) */}
        {!isLast && (
          <div 
            className="w-[2px] flex-1 z-0"
            style={{
              marginTop: '-4px', // entra levemente sob o circulo
              marginBottom: '-16px', // se estende até o próximo
              backgroundColor: styles.lineStyle === 'solid' ? styles.lineColor : 'transparent',
              backgroundImage: styles.lineStyle === 'dashed' 
                ? `linear-gradient(to bottom, #DED5C9 50%, transparent 50%)`
                : 'none',
              backgroundSize: styles.lineStyle === 'dashed' ? '100% 8px' : 'auto'
            }}
          />
        )}
      </div>

      {/* Triangle indicator for current step */}
      {isCurrent && (
        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-[#FFFDFC] ml-2 mt-[22px] relative z-10 drop-shadow-sm hidden sm:block" />
      )}

      {/* Coluna flexível do Conteúdo */}
      <div className={`flex-1 min-w-0 flex flex-col pt-0.5 ml-3 sm:ml-0 ${
        isCurrent 
          ? 'bg-[#FFFDFC] border border-[#DED5C9] rounded-[16px] p-4 sm:p-5 shadow-sm' 
          : 'py-2 pb-6'
      }`}>
        <div className="flex items-baseline gap-2 sm:gap-3">
          {status !== 'completed' && status !== 'locked' && status !== 'milestone' && (
            <span className="font-editorial text-[20px] sm:text-[22px] font-bold text-[#004F4D]">
              {number}
            </span>
          )}
          <h3 className={`font-sans font-bold text-[15px] sm:text-[16px] truncate ${styles.titleColor}`}>
            {title}
          </h3>
        </div>
        
        <div className="flex flex-col mt-0.5">
          <span className={`font-sans text-[13px] sm:text-[14px] leading-snug break-words ${styles.subtitleColor}`}>
            {subtitle}
          </span>
          
          {status === 'completed' && (
            <span className="font-sans text-[#006B68] text-[13px] font-semibold mt-1">
              Concluído
            </span>
          )}
        </div>

        {/* Current Step Progress Bar */}
        {isCurrent && progressPercent !== undefined && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-5 w-full">
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="flex-1 h-2.5 bg-[#E6E0D8] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#004F4D] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-sans font-bold text-[#004F4D] text-[13px] sm:text-[14px] w-[35px] text-right">
                {progressPercent}%
              </span>
            </div>
            
            <Link 
              href={href}
              className="border border-[#DED5C9] rounded-full px-5 py-2 font-sans font-semibold text-[13px] sm:text-[14px] text-[#004F4D] hover:bg-[#FBF7F0] hover:border-[#D6A63E] transition-colors w-full sm:w-auto text-center mt-2 sm:mt-0"
            >
              Continuar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
