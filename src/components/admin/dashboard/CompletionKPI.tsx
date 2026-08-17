import React from 'react';
import { Activity } from 'lucide-react';
import StatCard from '@/components/admin/ui/StatCard';

export default async function CompletionKPI() {
  return (
    <StatCard
      title="Conclusão média"
      value="98%"
      icon={Activity}
      variant="dark"
      trend={{ value: 2, label: 'este mês', isPositive: true }}
    />
  );
}
