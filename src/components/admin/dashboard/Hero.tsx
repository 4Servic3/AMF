import React, { Suspense } from 'react';
import SecurityCard from './SecurityCard';

function SecuritySkeleton() {
  return (
    <div className="bg-[#2A1B3D]/40 backdrop-blur-sm p-5 rounded-2xl border border-[#3A2B4D]/50 shadow-lg flex flex-col justify-center h-full min-w-[300px] w-full max-w-sm animate-pulse ml-auto">
      <div className="h-24"></div>
    </div>
  );
}

export default function Hero() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  
  return (
    <div className="relative w-full overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 z-10 pt-4 pb-6">
      {/* Background Graphics */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-[0.03] flex justify-end items-center mix-blend-screen">
        {/* Placeholder SVG for the "Gato linear / constelação" */}
        <svg viewBox="0 0 400 400" className="w-full h-full text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="200" cy="200" r="150" strokeDasharray="4 4" />
          <path d="M150 250 L200 150 L250 250 Z" />
          <circle cx="200" cy="150" r="4" fill="currentColor" />
          <circle cx="150" cy="250" r="4" fill="currentColor" />
          <circle cx="250" cy="250" r="4" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col">
        <span className="text-[#D4AF37] font-medium text-sm md:text-base mb-2 tracking-wide">
          {greeting}, Dra. Polyana
        </span>
        <h1 className="text-3xl md:text-[40px] leading-tight font-serif text-white font-bold mb-3">
          Central de Operações
        </h1>
        <p className="text-cream-100/70 text-sm md:text-base max-w-lg">
          Controle conteúdos, pessoas e acessos em um só lugar.
        </p>
      </div>

      <div className="relative z-10 w-full lg:w-auto">
        <Suspense fallback={<SecuritySkeleton />}>
          <SecurityCard />
        </Suspense>
      </div>
    </div>
  );
}
