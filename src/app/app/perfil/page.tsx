import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { 
  Bell, ChevronRight, User, Shield, BellRing, 
  HelpCircle, GraduationCap, Award, ExternalLink, Download, FileText
} from 'lucide-react';
import { LogoutButton } from './logout-button';

export default async function Perfil() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LogoutButton />
      </div>
    );
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, profession, role, avatar_url')
    .eq('id', user.id)
    .single();

  const name = profile?.full_name || user.email?.split('@')[0] || 'Usuário AMF';
  const roleTitle = profile?.profession === 'veterinarian' ? 'Médico-Veterinário' : profile?.profession === 'student' ? 'Estudante' : 'Membro';
  
  // 2. Fetch Acessos
  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('resource_id')
    .eq('profile_id', user.id)
    .eq('resource_type', 'course')
    .eq('status', 'active');
  
  const courseCount = entitlements?.length || 0;

  // 3. Fetch Assinatura
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, products(name)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 4. Fetch Certificados
  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, issued_at, courses(title)')
    .eq('profile_id', user.id)
    .order('issued_at', { ascending: false });

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0 pb-20">
      
      {/* HEADER AMF COMPACTO */}
      <header className="w-full bg-[#160820] text-white pt-10 sm:pt-14 pb-8 relative shrink-0 shadow-md">
        <div className="w-full max-w-2xl mx-auto px-6 relative z-10">
          
          <div className="flex items-center justify-between mb-8">
            <div className="font-editorial text-2xl font-bold text-[#E7B64F] tracking-widest leading-none">AMF</div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-white/50">Perfil</h1>
            <button className="text-white hover:text-[#D4AD62] transition-colors focus:outline-none" aria-label="Notificações">
              <Bell size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-5 mt-4">
            <div className="w-20 h-20 rounded-full border-2 border-[#D4AD62] bg-[#FAF7F1] flex items-center justify-center text-[#160820] text-2xl font-bold overflow-hidden shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-editorial text-2xl font-bold text-white truncate leading-tight">
                  {name}
                </h2>
                {profile?.role === 'admin' && (
                  <Shield size={16} className="text-[#D4AD62] flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-white/70 mb-3">{roleTitle}</p>
              <div>
                <Link href="/app/perfil/editar" className="inline-block bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors border border-white/10">
                  Editar dados
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO DO PERFIL */}
      <main className="w-full max-w-2xl mx-auto px-4 md:px-0 mt-6 flex flex-col gap-6">
        
        {/* Acessos */}
        <section>
          <div className="bg-white rounded-2xl border border-[#E8E1D3] p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F1] flex items-center justify-center text-[#0E5B5C]">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#160820] text-[15px]">Meus Acessos</h3>
                <p className="text-sm text-gray-500">{courseCount} {courseCount === 1 ? 'curso liberado' : 'cursos liberados'}</p>
              </div>
            </div>
            <Link href="/app/cursos" className="text-[#0E5B5C] bg-[#0E5B5C]/10 p-2.5 rounded-full hover:bg-[#0E5B5C]/20 transition-colors">
              <ChevronRight size={20} />
            </Link>
          </div>
        </section>

        {/* Assinatura */}
        <section>
          <h2 className="text-lg font-editorial text-[#160820] font-bold mb-3">Plano e Assinatura</h2>
          <div className="bg-white rounded-2xl border border-[#E8E1D3] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-[#160820] text-[15px]">
                  {subscription ? (subscription.products as any)?.name || 'Plano Premium' : 'Nenhum plano ativo'}
                </h3>
                {subscription?.status === 'active' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0F6466]/10 text-[#0F6466] text-[10px] font-bold uppercase">Ativa</span>
                )}
                {subscription?.status === 'canceled' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">Cancelada</span>
                )}
                {subscription?.status === 'past_due' && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase">Pendente</span>
                )}
              </div>
              {subscription?.current_period_end && (
                <p className="text-sm text-gray-500">
                  {subscription.status === 'active' ? 'Renovação em' : 'Validade até'}: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <Link href="/app/perfil/assinatura" className="text-sm font-bold text-[#0E5B5C] border border-[#0E5B5C] px-4 py-2 rounded-full text-center hover:bg-[#0E5B5C] hover:text-white transition-colors">
              Gerenciar
            </Link>
          </div>
        </section>

        {/* Certificados */}
        <section>
          <h2 className="text-lg font-editorial text-[#160820] font-bold mb-3">Certificados</h2>
          <div className="bg-white rounded-2xl border border-[#E8E1D3] overflow-hidden shadow-sm">
            {(!certificates || certificates.length === 0) ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Award size={32} className="text-[#D4AD62] mb-3" />
                <p className="text-sm text-gray-500 font-medium">Você ainda não possui certificados.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-[#E8E1D3] last:border-0 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-8 h-8 rounded-full bg-[#FAF7F1] flex items-center justify-center text-[#D4AD62] shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#160820] text-sm leading-tight mb-1">
                          {(cert.courses as any)?.title || 'Curso Concluído'}
                        </h4>
                        <p className="text-xs text-gray-500">Emitido em {new Date(cert.issued_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto pl-11 sm:pl-0">
                      <Link target="_blank" href={`/app/certificados/${cert.id}`} className="flex items-center gap-1.5 text-xs font-bold text-[#0E5B5C] hover:underline bg-[#0E5B5C]/5 px-3 py-1.5 rounded-full">
                        <ExternalLink size={14} /> Visualizar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Conta e Segurança */}
        <section>
          <h2 className="text-lg font-editorial text-[#160820] font-bold mb-3">Conta e Segurança</h2>
          <div className="bg-white rounded-2xl border border-[#E8E1D3] overflow-hidden shadow-sm flex flex-col">
            <Link href="/app/perfil/editar" className="flex items-center justify-between p-4 border-b border-[#E8E1D3] hover:bg-[#FAF7F1] transition-colors">
              <div className="flex items-center gap-3">
                <User size={18} className="text-[#0E5B5C]" />
                <span className="font-bold text-sm text-[#160820]">Dados Pessoais</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
            
            <Link href="/app/perfil/seguranca" className="flex items-center justify-between p-4 border-b border-[#E8E1D3] hover:bg-[#FAF7F1] transition-colors">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-[#0E5B5C]" />
                <span className="font-bold text-sm text-[#160820]">Segurança e Privacidade</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>

            <Link href="/app/perfil/notificacoes" className="flex items-center justify-between p-4 border-b border-[#E8E1D3] hover:bg-[#FAF7F1] transition-colors">
              <div className="flex items-center gap-3">
                <BellRing size={18} className="text-[#0E5B5C]" />
                <span className="font-bold text-sm text-[#160820]">Notificações</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>

            <Link href="/app/perfil/suporte" className="flex items-center justify-between p-4 border-b border-[#E8E1D3] hover:bg-[#FAF7F1] transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-[#0E5B5C]" />
                <span className="font-bold text-sm text-[#160820]">Ajuda e Suporte</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          </div>
          
          <div className="mt-8 flex justify-center pb-6">
            <LogoutButton />
          </div>
        </section>

      </main>
    </div>
  );
}
