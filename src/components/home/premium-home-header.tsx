import React from 'react';
import { PremiumPageHeader } from '@/components/layout/premium-page-header';
import { MemberHeaderActions } from '@/app/app/member-header-actions';

export function PremiumHomeHeader({ children }: { children: React.ReactNode }) {
  return (
    <PremiumPageHeader title="Início" rightSlot={<MemberHeaderActions />}>
      {children}
    </PremiumPageHeader>
  );
}
