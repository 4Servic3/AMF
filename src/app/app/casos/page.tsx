'use client';
import React, { useEffect } from 'react';
import { CasesPremiumHeader } from '@/components/casos/cases-premium-header';
import { CasesTabs } from '@/components/casos/cases-tabs';
import { CasesFilterButton } from '@/components/casos/cases-filter-button';
import { FeaturedCaseCard } from '@/components/casos/featured-case-card';
import { ContinueCaseCard } from '@/components/casos/continue-case-card';
import { SpecialtyRail } from '@/components/casos/specialty-rail';
import { RecentCasesFeed } from '@/components/casos/recent-cases-feed';
import { CloseFriendsArchiveBanner } from '@/components/casos/close-friends-archive-banner';
import { useStory } from '@/components/ui/stories/story-viewer-provider';
import { StoryCollection } from '@/lib/models/stories';

export default function CasosPage() {
  const { openStory } = useStory();

  // Coleção mock de Casos para o MVP
  const casosCollection: StoryCollection = {
    id: 'casos-feed',
    title: 'Feed de Casos',
    items: [
      { id: 'obstrucao', title: 'Obstrução uretral', category: 'Novo Caso', media_type: 'image', media_url: '/assets/amf-casos/hero/hero-obstrucao-uretral.webp', duration_seconds: 8, is_free: true, fit: 'cover' },
      { id: 'drc', title: 'DRC', category: 'Continue', media_type: 'image', media_url: '/assets/amf-casos/stories/story-drc.webp', duration_seconds: 8, is_free: true, fit: 'cover' },
      { id: 'felv', title: 'FeLV', category: 'Especialidade', media_type: 'image', media_url: '/assets/amf-casos/stories/story-felv.webp', duration_seconds: 8, is_free: true, fit: 'cover' },
      { id: 'nefrologia', title: 'Nefrologia', category: 'Especialidade', media_type: 'image', media_url: '/assets/amf-casos/stories/story-drc.webp', duration_seconds: 8, is_free: true, fit: 'cover' },
      { id: 'oncologia', title: 'Oncologia', category: 'Premium', media_type: 'image', media_url: '/assets/amf-casos/stories/story-oncologia.webp', duration_seconds: 8, is_free: false, fit: 'cover' },
      { id: 'emergencia', title: 'Emergência', category: 'Especialidade', media_type: 'image', media_url: '/assets/amf-casos/stories/story-emergencia.webp', duration_seconds: 8, is_free: true, fit: 'cover' },
      { id: 'diagnostico', title: 'Diagnóstico', category: 'Recente', media_type: 'image', media_url: '/assets/amf-casos/stories/story-diagnostico.webp', duration_seconds: 8, is_free: true, fit: 'cover' }
    ]
  };

  const handleOpenCase = (id: string) => {
    const index = casosCollection.items.findIndex(item => item.id === id);
    if (index !== -1) {
      openStory(casosCollection, index);
    }
  };

  useEffect(() => {
    // Analytics tracking could go here for client-side
  }, []);

  return (
    <>
      <div 
        className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0"
        style={{ overflowX: 'clip' }}
        data-layout-revision="cases-overflow-fix-v2"
      >
        <CasesPremiumHeader>
          <div className="casesSectionInner mt-6 flex items-center justify-between gap-2">
            <CasesTabs />
            <CasesFilterButton />
          </div>
        </CasesPremiumHeader>

        <div className="casesSectionInner flex flex-col flex-1">
          {/* O Hero sobrepõe a transição do header */}
          <div className="-mt-[56px] relative z-20 w-full min-w-0 max-w-full">
            <FeaturedCaseCard onStartCase={() => handleOpenCase('obstrucao')} />
          </div>

          <div className="flex flex-col gap-8 mt-6 w-full min-w-0 max-w-full">
            <ContinueCaseCard onContinue={() => handleOpenCase('drc')} />
          </div>
        </div>

        <div className="mt-2 w-full min-w-0 max-w-full overflow-hidden box-border">
          <SpecialtyRail onOpenSpecialty={handleOpenCase} />
        </div>
        
        <div className="casesSectionInner flex flex-col flex-1 pb-6">
          <RecentCasesFeed onOpenCase={handleOpenCase} />
          <CloseFriendsArchiveBanner />
        </div>
      </div>
    </>
  );
}
