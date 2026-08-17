import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function RecentActivity() {
  const supabase = await createClient();
  
  let safeLogs: any[] = [];
  try {
    const { data } = await supabase
      .from('admin_audit_logs')
      .select('id, created_at, action, entity_type, details, admin_id, profiles!admin_audit_logs_admin_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);
    safeLogs = data || [];
  } catch (err) {
    const { data } = await supabase
      .from('admin_audit_logs')
      .select('id, created_at, action, entity_type, details, admin_id')
      .order('created_at', { ascending: false })
      .limit(5);
    safeLogs = data || [];
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-[#EBE3D5] shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[16px] font-serif font-bold text-amf-ink-900">Atividade administrativa recente</h3>
        <Link href="/admin/audit" className="text-[12px] font-medium text-[#0F766E] flex items-center hover:underline">
          Abrir auditoria completa <ChevronRight size={14} />
        </Link>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-[#EBE3D5]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-amf-surface border-b border-[#EBE3D5]">
              <th className="px-4 py-3 text-[11px] font-bold text-amf-muted-600 uppercase tracking-wider">Data e hora</th>
              <th className="px-4 py-3 text-[11px] font-bold text-amf-muted-600 uppercase tracking-wider">Ator</th>
              <th className="px-4 py-3 text-[11px] font-bold text-amf-muted-600 uppercase tracking-wider">Ação realizada</th>
              <th className="px-4 py-3 text-[11px] font-bold text-amf-muted-600 uppercase tracking-wider">Área</th>
              <th className="px-4 py-3 text-[11px] font-bold text-amf-muted-600 uppercase tracking-wider">Detalhes</th>
              <th className="px-4 py-3 text-[11px] font-bold text-amf-muted-600 uppercase tracking-wider">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE3D5]">
            {(!safeLogs || safeLogs.length === 0) ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-amf-muted-600">Nenhuma atividade recente.</td>
              </tr>
            ) : (
              safeLogs.map((log: any) => {
                const isError = log.action.includes('fail') || log.action.includes('error');
                const actorName = log.profiles?.full_name || log.admin_id?.substring(0, 8) || 'Sistema';
                const detailsStr = log.details ? JSON.stringify(log.details) : '-';
                
                return (
                  <tr key={log.id} className="hover:bg-amf-surface transition-colors">
                    <td className="px-4 py-2.5 text-[12px] font-medium text-amf-muted-600 whitespace-nowrap">
                      {log.created_at && new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-medium text-amf-ink-900 truncate max-w-[120px]">
                      {actorName}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#EBE3D5]/50 text-amf-ink-900 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-medium text-amf-muted-600 capitalize">
                      {log.entity_type || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-amf-muted-600 max-w-[200px] truncate">
                      {detailsStr}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#0F766E]/5 text-[#0F766E] border border-[#0F766E]/10'
                      }`}>
                        {isError ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                        {isError ? 'Falha' : 'Sucesso'}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
