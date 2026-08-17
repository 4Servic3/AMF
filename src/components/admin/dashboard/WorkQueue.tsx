import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Clock, Calendar, TicketIcon, XCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

async function getCount(table: string, filterColumn?: string, filterValue?: string) {
  const supabase = await createClient();
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filterColumn && filterValue) {
    query = query.eq(filterColumn, filterValue);
  }
  const { count, error } = await query;
  if (error) {
    return 0;
  }
  return count || 0;
}

export default async function WorkQueue() {
  const [
    emRevisao,
    agendados,
    tickets,
    falhas
  ] = await Promise.all([
    getCount('cases', 'status', 'review').catch(() => 0),
    getCount('cases', 'status', 'scheduled').catch(() => 0),
    getCount('support_tickets', 'status', 'open').catch(() => 0),
    getCount('background_jobs', 'status', 'failed').catch(() => 0),
  ]);

  const queueItems = [
    { label: 'Em revisão', count: emRevisao, icon: Clock, href: '/admin/cases?status=review', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { label: 'Agendados', count: agendados, icon: Calendar, href: '/admin/cases?status=scheduled', color: 'text-[#0F766E]', bg: 'bg-[#0F766E]/10' },
    { label: 'Tickets abertos', count: tickets, icon: TicketIcon, href: '/admin/support?status=open', color: 'text-[#6B21A8]', bg: 'bg-[#6B21A8]/10' },
    { label: 'Falhas de job', count: falhas, icon: XCircle, href: '/admin/ops/jobs?status=failed', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-[#EBE3D5] shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-serif font-bold text-amf-ink-900">Fila de trabalho</h3>
        <Link href="/admin/operations" className="text-[12px] font-medium text-[#0F766E] flex items-center hover:underline">
          Ver fila <ChevronRight size={14} />
        </Link>
      </div>
      
      <div className="flex-1 space-y-2">
        {queueItems.map(item => (
          <Link key={item.label} href={item.href} className="group block outline-none">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#EBE3D5] transition-all group-hover:border-[#0F766E]/50 group-hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className={twMerge("p-1.5 rounded-md", item.bg, item.color)}>
                  <item.icon size={16} strokeWidth={2} />
                </div>
                <span className="text-[13px] font-medium text-amf-ink-900">{item.label}</span>
              </div>
              <div className={twMerge(
                "flex items-center justify-center min-w-[28px] h-6 px-2 rounded bg-amf-surface border border-[#EBE3D5] text-[12px] font-bold text-amf-ink-900",
                item.count > 0 ? "" : "opacity-50"
              )}>
                {item.count}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
