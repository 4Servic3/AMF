import React from 'react';
import { redirect } from 'next/navigation';
import { getFeatureFlags } from '@/lib/services/flags';
import { AcademyHeader } from '@/components/academia/academy-header';
import { AcademyProgressSummary } from '@/components/academia/academy-progress-summary';
import { ContinueJourneyCard } from '@/components/academia/continue-journey-card';
import { LearningPath } from '@/components/academia/learning-path';
import { NextMilestoneCard } from '@/components/academia/next-milestone-card';
import type { StepStatus } from '@/components/academia/learning-path-step';

export default async function AcademyPage() {
  const flags = await getFeatureFlags();
  if (!flags.member_academy_enabled) {
    redirect('/app/cursos');
  }
  const steps: { title: string; subtitle: string; status: StepStatus; progressPercent?: number }[] = [
    {
      title: 'Fundamentos essenciais',
      subtitle: 'Concluído',
      status: 'completed'
    },
    {
      title: 'Imersão Clínica P1',
      subtitle: '6 de 10 módulos',
      status: 'current',
      progressPercent: 62
    },
    {
      title: 'Imersão Clínica P2',
      subtitle: 'Libera após concluir P1',
      status: 'locked'
    },
    {
      title: 'Especialidades felinas',
      subtitle: 'Cardiologia, nefrologia e oncologia',
      status: 'locked'
    },
    {
      title: 'Certificação AMF',
      subtitle: 'Torne-se referência na medicina felina',
      status: 'milestone'
    }
  ];

  return (
    <div 
      className="flex flex-col w-full min-h-[100dvh] bg-[#16051F] overflow-x-hidden relative"
      style={{
        // Respiro inferior para a barra de navegação + safe-area
        paddingBottom: 'calc(74px + env(safe-area-bottom) + 24px)' 
      }}
    >
      {/* 
        Fundo fixo roxo no topo com gradiente e grafismo
      */}
      <div className="absolute top-0 left-0 w-full z-0 pointer-events-none" style={{ height: '500px', background: 'linear-gradient(135deg, #16051F 0%, #24102D 100%)' }}>
        <div 
          className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.15] translate-x-[20%] -translate-y-[10%]"
          style={{
            backgroundImage: 'url(/assets/amf-home/header-feline-lineart.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top right'
          }}
        />
      </div>

      {/* Main Content Area superior (Roxo) */}
      <div className="w-full max-w-[600px] lg:max-w-[768px] mx-auto px-0 relative z-10 flex-none">
        
        {/* Header */}
        <AcademyHeader />

        {/* Cards no roxo (sobrepostos) */}
        <div className="px-4 sm:px-6 -mt-[44px]">
          <AcademyProgressSummary 
            percentage={32}
            currentPhase={2}
            totalPhases={5}
            weeksRemaining={8}
          />
          
          <ContinueJourneyCard 
            title="Imersão Clínica P1"
            moduleInfo="Módulo 4 • Exame físico felino"
            durationMin={18}
            imageUrl="/assets/amf-home/hero-da-queixa-a-conduta.webp"
            href="#"
          />
        </div>
      </div>

      {/* Área Creme com cantos arredondados */}
      <div className="flex-1 w-full bg-[#FBF7F0] mt-10 rounded-t-[32px] sm:rounded-t-[40px] pt-2 pb-10 relative z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
        <div className="w-full max-w-[600px] lg:max-w-[768px] mx-auto px-4 sm:px-6">
          <LearningPath steps={steps} />
          
          <NextMilestoneCard title="Concluir 3 aulas para liberar o caso avaliativo" />
        </div>
      </div>
    </div>
  );
}
