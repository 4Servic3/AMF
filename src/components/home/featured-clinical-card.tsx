'use client';

import React from 'react';
import Link from 'next/link';
import { Library } from 'lucide-react';

interface FeaturedClinicalCardProps {
  title: string;
  subtitle: string;
  stepsCount?: number;
  imageUrl: string;
  href: string;
  hasMultiple?: boolean;
}

export function FeaturedClinicalCard({ title, subtitle, stepsCount, imageUrl, href, hasMultiple = false }: FeaturedClinicalCardProps) {
  return (
    <div 
      className="relative w-full rounded-[20px] overflow-hidden group bg-[#160B24] flex items-stretch border border-[rgba(224,193,126,0.24)] shadow-[0_14px_36px_rgba(17,15,24,0.22),0_3px_8px_rgba(17,15,24,0.10)]"
      style={{ 
        aspectRatio: '1.65/1',
        minHeight: '224px',
        maxHeight: '270px'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .hero-card-container {
            aspect-ratio: auto !important;
            min-height: 360px !important;
            max-height: 420px !important;
          }
        }
      `}} />
      <div className="absolute inset-0 hero-card-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl} 
          alt={`Destaque: ${title}`}
          className="w-full h-full object-cover"
          style={{ objectPosition: '74% 50%' }}
        />
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(90deg, rgba(4, 36, 41, 0.98) 0%, rgba(5, 38, 43, 0.94) 34%, rgba(10, 35, 40, 0.70) 56%, rgba(10, 24, 30, 0.12) 78%, rgba(10, 24, 30, 0.04) 100%)'
          }}
        />
      </div>

      <div 
        className="relative z-10 flex flex-col items-start justify-start h-full min-w-0"
        style={{ width: 'min(58%, 230px)', padding: '20px 0 18px 22px' }}
      >
        <span className="font-sans text-[#D4AD62] text-[11px] uppercase tracking-[0.06em] mb-2 block" style={{ fontWeight: 700 }}>
          Em Destaque
        </span>
        
        <h2 
          className="font-editorial text-[#F9F5EE] mb-2 leading-none"
          style={{ fontWeight: 600, fontSize: 'clamp(30px, 8vw, 38px)', maxWidth: '100%' }}
        >
          {title}
        </h2>
        
        <p 
          className="font-sans font-normal text-[13px] sm:text-[14px] text-[rgba(255,255,255,0.82)] mb-5 md:mb-8 line-clamp-3 md:line-clamp-2"
          style={{ lineHeight: 1.4, maxWidth: '100%' }}
        >
          {subtitle}
        </p>
        
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mt-auto md:mt-0 max-w-full min-w-0">
          <Link 
            href={href}
            className="inline-flex items-center justify-center bg-[#D4AD62] hover:bg-[#E0C17E] text-[#160B24] font-bold text-sm h-[44px] px-[21px] rounded-full transition-colors shadow-sm focus:outline-none shrink-0 max-w-full"
            style={{ width: 'auto' }}
          >
            Ver agora
          </Link>
          
          {stepsCount !== undefined && stepsCount > 0 && (
            <div className="flex items-center gap-2 text-[#F9F5EE] text-[13px] font-medium shrink-0">
              <Library size={18} strokeWidth={1.5} />
              <span>{stepsCount} etapas</span>
            </div>
          )}
        </div>
      </div>

      {hasMultiple && (
        <div className="absolute bottom-[24px] left-[24px] md:left-1/2 md:-translate-x-1/2 flex items-center gap-[6px]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#D4AD62]"></div>
          <div className="w-[6px] h-[6px] rounded-full bg-[rgba(255,255,255,0.35)]"></div>
          <div className="w-[6px] h-[6px] rounded-full bg-[rgba(255,255,255,0.35)]"></div>
        </div>
      )}
    </div>
  );
}

export function FeaturedClinicalCardSkeleton() {
  return (
    <div className="relative w-full rounded-[20px] overflow-hidden bg-[#160B24]/40 animate-pulse flex items-stretch border border-white/5" style={{ aspectRatio: '1.65/1', minHeight: '224px', maxHeight: '270px' }}>
      <style dangerouslySetInnerHTML={{__html: `@media (min-width: 768px) { .hero-card-container-sk { aspect-ratio: auto !important; min-height: 360px !important; max-height: 420px !important; } }`}} />
      <div className="absolute inset-0 hero-card-container-sk"></div>
      <div className="relative z-10 flex flex-col justify-center p-[24px] md:p-10 h-full w-[58%] md:w-full md:max-w-[440px]">
        <div className="h-3 w-24 bg-white/20 rounded-full mb-3"></div>
        <div className="h-10 w-full bg-white/20 rounded-lg mb-2"></div>
        <div className="h-10 w-3/4 bg-white/20 rounded-lg mb-4"></div>
        <div className="h-4 w-full bg-white/10 rounded-full mb-1"></div>
        <div className="h-4 w-5/6 bg-white/10 rounded-full mb-8"></div>
        <div className="h-12 w-32 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
}

export function FeaturedClinicalCardEmpty() {
  return (
    <div className="relative w-full rounded-[20px] overflow-hidden bg-[#160B24] flex items-center justify-center border border-white/10" style={{ aspectRatio: '1.65/1', minHeight: '224px', maxHeight: '270px' }}>
      <div className="text-center p-6">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <Library size={24} strokeWidth={1.5} className="text-[#D4AD62]/50" />
        </div>
        <h3 className="font-editorial text-xl text-white mb-1">Nenhum destaque</h3>
        <p className="text-sm text-white/50">Os casos em destaque aparecerão aqui.</p>
      </div>
    </div>
  );
}

export function FeaturedClinicalCardError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="relative w-full rounded-[20px] overflow-hidden bg-[#160B24] flex items-center justify-center border border-red-500/20" style={{ aspectRatio: '1.65/1', minHeight: '224px', maxHeight: '270px' }}>
      <div className="text-center p-6">
        <h3 className="font-editorial text-xl text-white mb-1">Não foi possível carregar</h3>
        <p className="text-sm text-white/50 mb-4">Ocorreu um erro ao carregar o destaque.</p>
        <button onClick={onRetry} className="text-[#D4AD62] font-semibold text-sm hover:underline">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
