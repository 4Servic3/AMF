import React from 'react';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/admin/ui/StatCard';
import Link from 'next/link';

export default async function ReviewKPI({ canManage }: { canManage: boolean }) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_review');

  const value = error ? 'N/A' : (count || 0);

  const card = (
    <StatCard
      title="Itens em revisão"
      value={value}
      icon={AlertCircle}
      variant="dark"
      className={canManage ? "hover:border-[#D4AF37]/50 transition-colors" : ""}
      trend={typeof value === 'number' && value > 0 ? { value: 100, label: 'atenção', isPositive: false } : undefined}
    />
  );

  return canManage ? <Link href="/admin/cases">{card}</Link> : card;
}
