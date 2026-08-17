import React from 'react';
import Link from 'next/link';
import { ChevronRight, LockKeyhole } from 'lucide-react';

export interface NewsArticle {
  tag: string;
  title: string;
  dateStr: string;
  imageUrl: string;
  href: string;
}

export function NewsSection({ news }: { news: NewsArticle }) {
  return (
    <section className="flex flex-col h-full w-full max-w-full min-w-0">
      <div className="flex flex-col mb-[24px]">
        <h2 
          className="font-editorial text-[#172638] tracking-wide leading-tight"
          style={{ fontSize: 'clamp(29px, 8vw, 31px)', fontWeight: 600 }}
        >
          Novidades
        </h2>
        {/* Traço decorativo */}
        <div className="w-[30px] h-[2px] bg-[#0E5B5C] mt-[8px] rounded-full"></div>
      </div>

      <Link 
        href={news.href}
        className="flex flex-row bg-[#FAF7F1] border border-[#D9D1C4] rounded-[15px] overflow-hidden md:hover:-translate-y-[2px] md:hover:border-[#0E5B5C] transition-all group h-[128px] focus:outline-none w-full max-w-full min-w-0"
      >
        <div className="w-[112px] sm:w-[42%] h-full shrink-0 relative bg-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={news.imageUrl} 
            alt={`Capa da novidade: ${news.title}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: '35% 50%' }}
          />
        </div>
        
        <div className="p-[14px] flex flex-col justify-between flex-1 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] md:text-[11px] font-sans font-bold text-[#0E5B5C] uppercase tracking-[0.06em] block mb-1 truncate">
              {news.tag}
            </span>
            <h3 
              className="font-editorial text-[#172638] leading-tight mb-1 line-clamp-3 overflow-hidden text-ellipsis"
              style={{ fontSize: 'clamp(20px, 5vw, 22px)', fontWeight: 600 }}
            >
              {news.title}
            </h3>
            <p className="text-[12px] md:text-[13px] font-sans font-normal text-[#172638]/80 truncate">
              {news.dateStr}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-auto min-w-0">
            <span className="text-[12px] md:text-[13px] font-sans font-semibold text-[#0E5B5C] truncate">
              Abrir conteúdo
            </span>
            <ChevronRight size={16} strokeWidth={2} className="text-[#0E5B5C] shrink-0" />
          </div>
        </div>
      </Link>
    </section>
  );
}

export function CloseFriendsBanner({ count, href, isSubscriber = true }: { count: number; href: string, isSubscriber?: boolean }) {
  // isSubscriber controla a regra de negócio visual:
  // - Usuário assinante: "Acessar" (vai para o acervo)
  // - Não assinante: "Conhecer" (vai para o paywall)
  const buttonText = isSubscriber ? "Acessar" : "Conhecer";

  return (
    <section className="flex flex-col h-full w-full max-w-full min-w-0">
      <div className="hidden lg:flex flex-col mb-[24px]">
        <h2 className="text-[29px] font-editorial font-semibold text-transparent select-none">
          Spacer
        </h2>
        <div className="w-[30px] h-[2px] bg-transparent mt-[8px]"></div>
      </div>
      
      <Link 
        href={href}
        className="relative rounded-[14px] px-[16px] py-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3 overflow-hidden shadow-sm group h-auto min-h-[74px] focus:outline-none w-full max-w-full min-w-0"
        style={{ 
          background: 'linear-gradient(120deg, #07383C 0%, #062A2E 65%, #0B3437 100%)',
          border: '1px solid rgba(212,173,98,0.32)'
        }}
      >
        <div className="flex items-center gap-3 relative z-10 min-w-0 max-w-full w-full sm:w-auto">
          <div className="w-[40px] h-[40px] rounded-full border border-[#D4AD62]/40 flex items-center justify-center text-[#D4AD62] shrink-0">
            <LockKeyhole size={18} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 
              className="font-editorial text-[#D4AD62] leading-none mb-1 truncate"
              style={{ fontSize: 'clamp(20px, 5vw, 22px)', fontWeight: 600 }}
            >
              Close Friends
            </h3>
            <p className="font-sans font-normal text-[12px] sm:text-[13px] text-[rgba(255,255,255,0.84)] truncate">
              {count} novos casos disponíveis
            </p>
          </div>
        </div>
        
        <div className="relative z-10 shrink-0 px-[16px] h-[36px] flex items-center justify-center rounded-full border border-[#D4AD62] text-[#D4AD62] text-[13px] font-sans font-semibold group-hover:bg-[#D4AD62] group-hover:text-[#07383C] transition-colors whitespace-nowrap self-end sm:self-auto max-w-[120px]">
          {buttonText}
        </div>
      </Link>
    </section>
  );
}
