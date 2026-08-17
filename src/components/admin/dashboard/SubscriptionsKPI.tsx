import React from 'react';
import { CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/admin/ui/StatCard';

export default async function SubscriptionsKPI() {
  const supabase = await createClient();
  const { count, error } = await supabase.from('entitlements').select('*', { count: 'exact', head: true });

  const value = error ? 'N/A' : (count || 0);

  return (
    <StatCard
      title="Assinaturas"
      value={value}
      icon={CreditCard}
      variant="dark"
      trend={{ value: 8, label: 'este mês', isPositive: true }}
    />
  );
}
