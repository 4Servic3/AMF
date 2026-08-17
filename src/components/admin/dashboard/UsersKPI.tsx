import React from 'react';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/admin/ui/StatCard';
import Link from 'next/link';

export default async function UsersKPI({ canManage }: { canManage: boolean }) {
  const supabase = await createClient();
  const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  const value = error ? 'N/A' : (count || 0);

  const card = (
    <StatCard
      title="Usuários ativos"
      value={value}
      icon={Users}
      variant="dark"
      className={canManage ? "hover:border-[#D4AF37]/50 transition-colors" : ""}
      trend={{ value: 12, label: 'este mês', isPositive: true }}
    />
  );

  return canManage ? <Link href="/admin/users">{card}</Link> : card;
}
