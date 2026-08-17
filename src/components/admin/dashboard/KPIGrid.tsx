import React, { Suspense } from 'react';
import UsersKPI from './UsersKPI';
import SubscriptionsKPI from './SubscriptionsKPI';
import CompletionKPI from './CompletionKPI';
import ReviewKPI from './ReviewKPI';
import { hasPermission } from '@/lib/auth/dal';
import StatCard from '@/components/admin/ui/StatCard';
import { Users, CreditCard, Activity, AlertCircle } from 'lucide-react';

function StatSkeleton({ title, icon }: { title: string, icon: any }) {
  return <StatCard title={title} value="..." icon={icon} variant="dark" />;
}

export default async function KPIGrid() {
  const canManageUsers = await hasPermission('users.manage');
  const canManageCases = await hasPermission('cases.manage');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full z-10 relative mt-4">
      <div className="w-full">
        <Suspense fallback={<StatSkeleton title="Usuários ativos" icon={Users} />}>
          <UsersKPI canManage={canManageUsers} />
        </Suspense>
      </div>
      <div className="w-full">
        <Suspense fallback={<StatSkeleton title="Assinaturas" icon={CreditCard} />}>
          <SubscriptionsKPI />
        </Suspense>
      </div>
      <div className="w-full">
        <Suspense fallback={<StatSkeleton title="Conclusão média" icon={Activity} />}>
          <CompletionKPI />
        </Suspense>
      </div>
      <div className="w-full">
        <Suspense fallback={<StatSkeleton title="Itens em revisão" icon={AlertCircle} />}>
          <ReviewKPI canManage={canManageCases} />
        </Suspense>
      </div>
    </div>
  );
}
