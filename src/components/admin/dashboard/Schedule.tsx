import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function Schedule() {
  const supabase = await createClient();
  
  // mock for schedule: cases that are set to publish in the future
  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, status, publish_at')
    .gt('publish_at', new Date().toISOString())
    .order('publish_at', { ascending: true })
    .limit(3);

  // Generate a mini weekly calendar for the current week
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      label: d.toLocaleDateString('pt-BR', { weekday: 'narrow' }),
      date: d.getDate(),
      isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
    };
  });

  return (
    <div className="bg-white p-5 rounded-xl border border-[#EBE3D5] shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[16px] font-serif font-bold text-amf-ink-900">Publicações e agenda</h3>
        <Link href="/admin/operations" className="text-[12px] font-medium text-[#0F766E] flex items-center hover:underline">
          Ver agenda completa <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#EBE3D5]">
        {weekDays.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-medium text-amf-muted-600 uppercase">{day.label}</span>
            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-medium ${
              day.isToday ? 'bg-[#0F766E] text-white' : 'text-amf-ink-900'
            }`}>
              {day.date}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {(!cases || cases.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-4">
            <p className="text-[13px] text-amf-muted-600">Nenhuma publicação agendada para os próximos dias.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cases.map((c: any) => (
              <li key={c.id} className="flex gap-3 items-start group">
                <div className="flex flex-col items-end shrink-0 w-12 pt-0.5">
                  <span className="text-[12px] font-bold text-amf-ink-900">
                    {c.publish_at && new Date(c.publish_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="w-[2px] h-full bg-[#EBE3D5] rounded-full mt-1 shrink-0 group-last:bg-transparent"></div>
                <div className="flex flex-col flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">Caso Clínico</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amf-surface border border-[#EBE3D5] text-amf-muted-600">
                      {c.status === 'scheduled' ? 'Agendado' : c.status}
                    </span>
                  </div>
                  <Link href={`/admin/cases/${c.id}`} className="text-[13px] font-medium text-amf-ink-900 hover:text-[#0F766E] leading-tight line-clamp-2">
                    {c.title}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
