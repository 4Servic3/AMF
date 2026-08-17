import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { hasPermission } from '@/lib/auth/dal';

export default async function AttentionUsers() {
  const canManageSupport = await hasPermission('support.manage') || await hasPermission('users.manage');

  if (!canManageSupport) {
    return null;
  }

  const supabase = await createClient();
  
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, created_at, profile_id, profiles(full_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className="bg-white p-5 rounded-xl border border-[#EBE3D5] shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[16px] font-serif font-bold text-amf-ink-900">Atenção requerida</h3>
        <Link href="/admin/support" className="text-[12px] font-medium text-[#0F766E] flex items-center hover:underline">
          Ver todos <ChevronRight size={14} />
        </Link>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {(!tickets || tickets.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-4">
            <p className="text-[13px] text-amf-muted-600">Sem pendências críticas.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t: any) => {
              const fullName = t.profiles?.full_name || 'Usuário';
              const initials = fullName.substring(0, 2).toUpperCase();
              
              return (
                <li key={t.id} className="flex gap-3 items-center group border-b border-[#EBE3D5] last:border-0 pb-3 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-amf-surface border border-[#EBE3D5] flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-amf-ink-900">{initials}</span>
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-amf-ink-900 truncate">
                        {fullName}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#6B21A8]/10 text-[#6B21A8] shrink-0">
                        Suporte
                      </span>
                    </div>
                    <Link href={`/admin/support/${t.id}`} className="text-[12px] text-amf-muted-600 truncate hover:text-[#0F766E]">
                      {t.subject}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
