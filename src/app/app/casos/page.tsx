import React from 'react';
import { getFeatureFlags } from '@/lib/services/flags';
import CasosClient from './casos-client';
import { Lock } from 'lucide-react';

export default async function CasosPage() {
  const flags = await getFeatureFlags();

  if (!flags.member_cases_enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#FAF7F1] px-6 text-center">
        <div className="w-16 h-16 bg-[#160B24]/5 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-[#D4AD62]" />
        </div>
        <h1 className="font-editorial text-3xl font-bold text-[#160B24] mb-3">
          Casos Clínicos
        </h1>
        <p className="font-sans text-[#78664E] max-w-[280px]">
          Esta área estará disponível em breve. Estamos preparando novos casos para você.
        </p>
      </div>
    );
  }

  return <CasosClient />;
}
