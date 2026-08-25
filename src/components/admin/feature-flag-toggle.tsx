'use client';

import { useTransition } from 'react';
import { toggleFeatureFlag } from '@/app/admin/actions/settings';

type FlagProps = {
  flagKey: string;
  enabled: boolean;
  description: string;
};

export function FeatureFlagToggle({ flagKey, enabled, description }: FlagProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const action = enabled ? 'desativar' : 'ativar';
    const confirmMessage = `Tem certeza que deseja ${action} a flag ${flagKey}? Isso terá impacto direto no painel dos membros.`;
    
    if (window.confirm(confirmMessage)) {
      startTransition(() => {
        toggleFeatureFlag(flagKey, !enabled).catch((e) => alert(e.message));
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div>
        <div className="font-semibold text-gray-900">{flagKey}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${enabled ? 'bg-blue-600' : 'bg-gray-200'} ${isPending ? 'opacity-50' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
