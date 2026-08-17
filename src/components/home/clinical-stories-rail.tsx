'use client';
import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { useStory } from '@/components/ui/stories/story-viewer-provider';
import { StoryCollection } from '@/lib/models/stories';

export interface ClinicalStory {
  id: string;
  title: string;
  coverUrl: string;
  accentColor?: string;
  publishedAt: string;
  expiresAt?: string | null;
  seen: boolean;
  isNew: boolean;
  locked: boolean;
  requiredProductId?: string | null;
  slidesCount: number;
  viewedSlidesCount: number;
}

interface ClinicalStoriesRailProps {
  stories: ClinicalStory[];
}

export function ClinicalStoriesRail({ stories }: ClinicalStoriesRailProps) {
  const { openStory } = useStory();

  // Converter o formato antigo para a coleção usada pelo visualizador global
  const homeCollection: StoryCollection = {
    id: 'home-stories',
    title: 'Casos da semana',
    items: stories.map((s) => ({
      id: s.id,
      media_type: 'image',
      media_url: s.coverUrl,
      duration_seconds: 8,
      title: s.title,
      is_free: !s.locked,
      is_new: s.isNew,
      fit: 'contain', // Na Home mantemos o fit em contain
    }))
  };

  return (
    <section className="mt-[22px] mb-6 w-full max-w-full min-w-0">
      {/* Título da seção */}
      <div className="flex flex-col mb-0 px-4">
        <h2 className="text-[21px] font-sans font-semibold text-[#F9F5EE] tracking-wide" style={{ fontWeight: 600 }}>
          Casos da semana
        </h2>
        {/* Sublinhado dourado 28x2px a 8px do título */}
        <div className="w-[28px] h-[2px] bg-[#D4AD62] mt-[8px] rounded-full"></div>
      </div>

      {/* Faixa scrollável */}
      <div 
        className="flex gap-[15px] overflow-x-auto mt-[14px] pb-4 px-4 hide-scrollbar snap-x snap-proximity w-full max-w-full min-w-0"
        style={{ overflowY: 'visible', overscrollBehaviorInline: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {stories.map((story, index) => {
          // Determina a cor do anel
          const ringStyle: React.CSSProperties = {};
          if (story.isNew) {
            ringStyle.background = '#FF7068';
          } else if (story.accentColor) {
            ringStyle.background = story.accentColor;
          } else {
            ringStyle.background = '#D4AD62'; // fallback dourado
          }

          // Se já foi visto, reduz saturação e opacidade
          if (story.seen && !story.isNew) {
            ringStyle.opacity = 0.62;
            ringStyle.filter = 'saturate(0.5)';
          }

          const ariaLabel = `Abrir Story ${story.title}${story.isNew ? ', conteúdo novo' : ''}${story.locked ? ', bloqueado' : ''}`;

          return (
            <button 
              key={story.id} 
              onClick={() => openStory(homeCollection, index)}
              aria-label={ariaLabel}
              className="flex flex-col items-center gap-2 min-w-[70px] w-[70px] md:min-w-[76px] md:w-[76px] snap-start group transition-transform duration-200 focus:outline-none"
            >
              <div className="relative">
                {/* Badge NOVO */}
                {story.isNew && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-[#FF7068] text-[10px] sm:text-[11px] font-sans font-bold px-1 py-0.5 rounded-sm uppercase">
                    NOVO
                  </div>
                )}
                
                <div 
                  className="w-[70px] h-[70px] md:w-[76px] md:h-[76px] rounded-full p-[3px] flex items-center justify-center"
                  style={ringStyle}
                >
                  <div className="w-full h-full rounded-full border-[2px] border-[#160B24] overflow-hidden bg-[#160B24] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={story.coverUrl} 
                      alt={`Capa do caso ${story.title}`}
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${story.locked ? 'opacity-80' : 'opacity-100'}`}
                      width={70}
                      height={70}
                    />
                  </div>
                </div>

                {/* Ícone de Cadeado se bloqueado */}
                {story.locked && (
                  <div className="absolute bottom-0 right-0 w-[20px] h-[20px] z-20 bg-[#14091F] border border-[#D4AD62] rounded-full flex items-center justify-center text-[#D4AD62] shadow-sm">
                    <LockKeyhole size={10} strokeWidth={2.5} />
                  </div>
                )}
              </div>
              
              {/* Título do Story */}
              <span className="text-[12px] md:text-[13px] text-[#F9F5EE] font-medium text-center w-full truncate px-1 transition-colors group-hover:text-white">
                {story.title}
              </span>
            </button>
          );
        })}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
}
