import React from 'react';

type PremiumPageHeaderProps = {
  title: string;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
};

export function PremiumPageHeader({ title, rightSlot, children }: PremiumPageHeaderProps) {
  return (
    <div 
      className="relative w-full text-white pb-[24px]"
      style={{ 
        background: 'linear-gradient(135deg, #1C0D29 0%, #160B24 52%, #081E27 85%)',
        minHeight: 'auto',
      }}
    >
      {/* Elemento decorativo Feline Lineart */}
      <div 
        className="absolute top-0 right-0 pointer-events-none"
        aria-hidden="true"
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          opacity: 0.08,
          backgroundColor: '#D4AD62',
          maskImage: 'url("/assets/amf-home/header-feline-lineart.svg")',
          WebkitMaskImage: 'url("/assets/amf-home/header-feline-lineart.svg")',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'top right',
          WebkitMaskPosition: 'top right',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          overflow: 'clip'
        }}
      />

      {/* Top Navigation Bar */}
      <div 
        className="casesSectionInner relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-[10px]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 18px)', height: 'calc(env(safe-area-inset-top) + 18px + 48px)' }}
      >
        {/* 1. Monograma AMF à esquerda */}
        <div className="font-editorial font-bold text-[28px] md:text-[31px] text-[#D4AD62] leading-none flex justify-start">
          AMF
        </div>
        
        {/* 2. Texto centralizado */}
        <div className="font-sans font-semibold text-[19px] text-[#F9F5EE] leading-none flex justify-center whitespace-nowrap">
          {title}
        </div>
        
        {/* 3. Slot à direita */}
        <div className="flex items-center justify-end gap-[10px]">
          {rightSlot}
        </div>
      </div>

      {/* Content slot for everything else */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
