import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAdminContext } from '@/lib/auth/dal';

export default async function SecurityCard() {
  const supabase = await createClient();
  const { session } = await getAdminContext();
  
  const mfaEnabled = session?.user?.factors && session.user.factors.length > 0;

  const { data: lastBackup } = await supabase
    .from('admin_audit_logs')
    .select('created_at')
    .like('action', 'export%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const formattedDate = lastBackup?.created_at 
    ? new Date(lastBackup.created_at).toLocaleDateString('pt-BR') 
    : 'Nenhum backup recente';

  return (
    <div className="bg-[#2A1B3D]/40 backdrop-blur-sm p-5 rounded-2xl border border-[#3A2B4D]/50 shadow-lg flex flex-col justify-center h-full max-w-sm ml-auto">
      <div className="flex items-start gap-4">
        <div className="bg-[#D4AF37]/10 p-2.5 rounded-xl text-[#D4AF37]">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#D4AF37] mb-1">Ambiente protegido</h3>
          <div className="space-y-1 mt-2">
            <p className="text-[13px] text-cream-100/70 flex justify-between gap-4">
              <span>MFA Status</span>
              <span className="font-medium text-cream-50">{mfaEnabled ? 'Ativo' : 'Inativo'}</span>
            </p>
            <p className="text-[13px] text-cream-100/70 flex justify-between gap-4">
              <span>Último Backup</span>
              <span className="font-medium text-cream-50">{formattedDate}</span>
            </p>
            <p className="text-[13px] text-cream-100/70 flex justify-between gap-4">
              <span>Sistemas</span>
              <span className="font-medium text-green-400">Operacional</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
