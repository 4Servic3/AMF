import React from 'react';
import { trackEvent } from '@/lib/services/analytics';
import { PremiumHomeHeader } from '@/components/home/premium-home-header';
import { ClinicalStoriesRail, type ClinicalStory } from '@/components/home/clinical-stories-rail';
import { FeaturedClinicalCard } from '@/components/home/featured-clinical-card';
import { AcademyQuickAccess } from '@/components/home/academy-quick-access';
import { NewsSection, CloseFriendsBanner, type NewsArticle } from '@/components/home/news-and-close-friends';

// Mock data (replace with actual DB calls later)
const mockStories: ClinicalStory[] = [
  { id: 'caso-42', title: 'Caso 42', coverUrl: '/assets/amf-home/story-caso-42.webp', accentColor: '#FF7068', isNew: true, seen: false, locked: false, publishedAt: new Date().toISOString(), slidesCount: 5, viewedSlidesCount: 0 },
  { id: 'felv', title: 'FeLV', coverUrl: '/assets/amf-home/story-felv.webp', accentColor: '#D4AD62', isNew: false, seen: false, locked: false, publishedAt: new Date().toISOString(), slidesCount: 3, viewedSlidesCount: 0 },
  { id: 'drc', title: 'DRC', coverUrl: '/assets/amf-home/story-drc.webp', accentColor: '#59BFAE', isNew: false, seen: true, locked: false, publishedAt: new Date().toISOString(), slidesCount: 4, viewedSlidesCount: 4 },
  { id: 'oncologia', title: 'Oncologia', coverUrl: '/assets/amf-home/story-oncologia.webp', accentColor: '#D4AD62', isNew: false, seen: false, locked: true, publishedAt: new Date().toISOString(), slidesCount: 6, viewedSlidesCount: 0 },
  { id: 'plantao', title: 'Plantão', coverUrl: '/assets/amf-home/story-plantao.webp', accentColor: '#59BFAE', isNew: false, seen: true, locked: false, publishedAt: new Date().toISOString(), slidesCount: 2, viewedSlidesCount: 2 }
];

const mockNews: NewsArticle = {
  tag: 'Caso Clínico',
  title: 'Paciente felino com perda de peso progressiva',
  dateStr: 'Publicado hoje • 14 min',
  imageUrl: '/assets/amf-home/novidades-perda-de-peso.webp',
  href: '/app/casos/perda-de-peso'
};

export default async function AppHome() {
  const userId = 'fake-user-id';
  trackEvent('home_viewed', { userId });

  return (
    <div 
      className="premium-home flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0 max-w-full"
      style={{ overflowX: 'clip' }}
    >
      {/* 
        O PremiumHomeHeader ocupa toda a largura disponível no topo.
        Os filhos passados para ele (Hero, etc.) ficam contidos no max-width.
      */}
      <PremiumHomeHeader>
        <div className="max-w-[1240px] mx-auto w-full min-w-0 max-w-full">
          {/* Stories Rail (dentro da área escura) */}
          <ClinicalStoriesRail stories={mockStories} />
        </div>
      </PremiumHomeHeader>

      {/* 
        A partir daqui, os elementos estão na transição ou na área clara.
      */}
      <div className="home-content-container max-w-[1240px] mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 -mt-[22px] md:-mt-[32px] relative z-10 w-full min-w-0 max-w-full">
          
          {/* Hero Banner (Ocupa 8 colunas no Desktop) */}
          <div className="lg:col-span-8 min-w-0 max-w-full">
            <FeaturedClinicalCard 
              title="Da queixa à conduta clínica"
              subtitle="Acompanhe o raciocínio completo da Dra. Polyana"
              stepsCount={5}
              imageUrl="/assets/amf-home/hero-da-queixa-a-conduta.webp"
              href="/app/casos/conduta-clinica"
            />
          </div>

          {/* Quick Access (Ocupa 4 colunas no Desktop) */}
          <div className="lg:col-span-4 min-w-0 max-w-full">
            <AcademyQuickAccess 
              courseTitle="Imersão Clínica"
              courseProgress={62}
              courseHref="/app/cursos/imersao-clinica"
              savedMaterialsCount={12}
              materialsHref="/app/perfil/materiais"
            />
          </div>

        </div>

        {/* Linha 2: Novidades e Close Friends */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 mt-[16px] lg:mt-8 w-full min-w-0 max-w-full">
          
          {/* News Card (8 colunas) */}
          <div className="lg:col-span-8 min-w-0 max-w-full">
            <NewsSection news={mockNews} />
          </div>

          {/* Close Friends Banner (4 colunas) */}
          <div className="lg:col-span-4 mt-[32px] lg:mt-0 mb-8 lg:mb-0 min-w-0 max-w-full">
            <CloseFriendsBanner count={2} href="/app/close-friends" />
          </div>

        </div>
      </div>
    </div>
  );
}
