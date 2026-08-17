import React from 'react';
import { getUserEntitlements } from '@/lib/services/access';
import Image from 'next/image';
import { Bell, ChevronRight, CheckCircle2, BookOpen, Award, Folder, Star, Shield, User, BellRing, Accessibility, HelpCircle, Book, Lock } from 'lucide-react';
import Link from 'next/link';
import { LogoutButton } from './logout-button';

// --- VIEW MODELS (Etapa 3) ---

type SubscriptionStatus = 'ATIVA' | 'EM_TESTE' | 'CANCELAMENTO_AGENDADO' | 'EXPIRADA' | 'PAGAMENTO_PENDENTE' | 'SEM_ASSINATURA';

interface ProfileSubscriptionViewModel {
  status: SubscriptionStatus;
  planName?: string;
  nextBillingDate?: string;
  trialEndDate?: string;
  accessEndDate?: string;
}

interface ProfileIdentityViewModel {
  userId: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
  professionLabel?: string;
  memberSinceLabel?: string;
  isVerified: boolean;
  securityStatus: 'Protegida' | 'Revisar';
}

interface ProfileQuickStats {
  activeEntitlementsCount: number;
  issuedCertificatesCount: number;
  savedMaterialsCount: number;
  favoritesCount: number;
}

interface ActiveCourseViewModel {
  id: string;
  title: string;
  moduleCount: number;
  progressPercent: number;
  destinationUrl: string;
}

export default async function ProfilePage() {
  // Simulação de Dados Seguros
  const userId = 'fake-user-id';
  const entitlements = await getUserEntitlements(userId);
  
  // O Mock seguro
  const identity: ProfileIdentityViewModel = {
    userId,
    displayName: 'Dra. Polyana',
    initials: 'DR',
    professionLabel: 'Médica-veterinária',
    memberSinceLabel: 'Membro desde 2026',
    isVerified: true,
    securityStatus: 'Protegida'
  };

  const quickStats: ProfileQuickStats = {
    activeEntitlementsCount: entitlements.length || 3,
    issuedCertificatesCount: 1,
    savedMaterialsCount: 12,
    favoritesCount: 5
  };

  const activeCourse: ActiveCourseViewModel = {
    id: '3333',
    title: 'Imersão Clínica P2',
    moduleCount: 10,
    progressPercent: 28, // Entre 0 e 100
    destinationUrl: '/app/cursos/imersao-parte-2'
  };

  const subscription: ProfileSubscriptionViewModel = {
    status: 'ATIVA',
    planName: 'Academia Completa',
    nextBillingDate: '15 de setembro'
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0" data-page="profile">
      {/* HEADER PREMIUM FULL-BLEED */}
      <header className="w-full bg-[#160820] text-white pt-10 sm:pt-14 pb-12 relative overflow-hidden shrink-0" data-profile-header>
        {/* Line-art de fundo */}
        <div className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-20">
          <Image src="/assets/amf-home/header-feline-lineart.svg" alt="" fill className="object-cover object-right-top" priority sizes="(max-width: 768px) 100vw, 66vw" />
        </div>
        
        <div className="w-full max-w-4xl mx-auto px-6 relative z-10">
          {/* Top Bar */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-8">
            <div className="font-editorial text-2xl font-bold text-[#E7B64F] tracking-widest leading-none justify-self-start">AMF</div>
            <div className="font-sans font-medium text-white/90 text-[15px] justify-self-center">Perfil</div>
            <div className="flex items-center justify-self-end">
              <button className="w-[44px] h-[44px] rounded-full border border-white/20 flex items-center justify-center text-[#E7B64F] active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B64F]" aria-label="Notificações">
                <Bell size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          
          {/* Identidade / Profile Info */}
          <div className="flex items-center gap-4 mb-4" data-profile-identity>
            <div className="w-[72px] h-[72px] rounded-full bg-[#003D3F] flex items-center justify-center text-white text-xl font-bold border-2 border-transparent relative overflow-hidden shrink-0">
              {identity.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-[22px] font-bold text-white leading-tight truncate mb-1">
                {identity.displayName}
              </h1>
              <div className="text-[13px] text-white/70 font-light truncate mb-2">
                {identity.professionLabel} • {identity.memberSinceLabel}
              </div>
              {identity.isVerified && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E7B64F]/30 bg-[#E7B64F]/10 text-[#E7B64F] text-[11px] font-bold">
                  <CheckCircle2 size={12} fill="currentColor" className="text-[#160820]" />
                  Conta verificada
                </div>
              )}
            </div>
            
            <div className="ml-auto shrink-0 self-start">
               <Link href="/app/perfil/editar" className="flex items-center justify-center min-w-[44px] min-h-[44px] px-4 py-2 rounded-full border border-white/20 text-white/90 text-[13px] font-medium hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B64F]">
                 <span>Editar</span>
               </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* PAINEL CREME (MAIN CONTENT) */}
      <div className="w-full flex-1 bg-[#FAF7F1] rounded-t-[28px] -mt-6 relative z-20 flex flex-col min-w-0">
        <main className="w-full max-w-4xl mx-auto px-6 pt-8 flex-1 flex flex-col gap-8 pb-20 min-w-0">
          
          {/* SEÇÃO ACESSO RÁPIDO */}
          <section data-profile-quick-access>
            <h2 className="text-[20px] font-editorial text-[#14172A] font-bold mb-4 inline-block relative">
              Acesso rápido
              <div className="absolute -bottom-1 left-0 w-1/3 h-[2px] bg-[#003D3F] rounded-full"></div>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               {/* Meus acessos */}
               <Link href="/app/cursos?filter=meus-acessos" className="bg-white rounded-[20px] p-4 border border-[#DED5C8] flex flex-col gap-2 hover:border-[#003D3F]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D3F]">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#003D3F] mb-1">
                     <BookOpen size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-[#14172A] truncate">
                      <span className="text-[#003D3F] text-lg mr-2" aria-label={`${quickStats.activeEntitlementsCount} cursos liberados`}>{quickStats.activeEntitlementsCount}</span>
                      Meus acessos
                    </h3>
                    <p className="text-[12px] text-[#657080] truncate">Cursos liberados</p>
                  </div>
               </Link>
               {/* Certificados */}
               <Link href="/app/perfil/certificados" className="bg-white rounded-[20px] p-4 border border-[#DED5C8] flex flex-col gap-2 hover:border-[#003D3F]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D3F]">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#E7B64F] mb-1">
                     <Award size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-[#14172A] truncate">
                      <span className="text-[#003D3F] text-lg mr-2" aria-label={`${quickStats.issuedCertificatesCount} certificados emitidos`}>{quickStats.issuedCertificatesCount}</span>
                      Certificados
                    </h3>
                    <p className="text-[12px] text-[#657080] truncate">Emitidos</p>
                  </div>
               </Link>
               {/* Materiais */}
               <Link href="/app/perfil/materiais" className="bg-white rounded-[20px] p-4 border border-[#DED5C8] flex flex-col gap-2 hover:border-[#003D3F]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D3F]">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#E7B64F] mb-1">
                     <Folder size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-[#14172A] truncate">
                      <span className="text-[#003D3F] text-lg mr-2" aria-label={`${quickStats.savedMaterialsCount} materiais salvos`}>{quickStats.savedMaterialsCount}</span>
                      Materiais
                    </h3>
                    <p className="text-[12px] text-[#657080] truncate">Arquivos salvos</p>
                  </div>
               </Link>
               {/* Favoritos */}
               <Link href="/app/perfil/favoritos" className="bg-white rounded-[20px] p-4 border border-[#DED5C8] flex flex-col gap-2 hover:border-[#003D3F]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D3F]">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#E7B64F] mb-1">
                     <Star size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-[#14172A] truncate">
                      <span className="text-[#003D3F] text-lg mr-2" aria-label={`${quickStats.favoritesCount} conteúdos favoritos`}>{quickStats.favoritesCount}</span>
                      Favoritos
                    </h3>
                    <p className="text-[12px] text-[#657080] truncate">Conteúdos salvos</p>
                  </div>
               </Link>
            </div>
          </section>

          {/* SEÇÃO MINHA JORNADA */}
          <section data-profile-journey>
            <h2 className="text-[20px] font-editorial text-[#14172A] font-bold mb-4 inline-block relative">
              Minha jornada
              <div className="absolute -bottom-1 left-0 w-1/3 h-[2px] bg-[#003D3F] rounded-full"></div>
            </h2>
            
            {activeCourse ? (
              <div className="bg-white rounded-[20px] border border-[#DED5C8] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#003D3F]/5 flex items-center justify-center text-[#003D3F] shrink-0 border border-[#003D3F]/10">
                    <Book size={22} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#E7B64F] uppercase tracking-widest block mb-1">Curso em andamento</span>
                    <h3 className="font-bold text-[15px] text-[#14172A] truncate leading-tight mb-1">{activeCourse.title}</h3>
                    <p className="text-[12px] text-[#657080] truncate">
                      {activeCourse.moduleCount} módulos • {Math.max(0, Math.min(100, activeCourse.progressPercent))}% concluído
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link href={activeCourse.destinationUrl} className="flex items-center justify-center h-[36px] px-4 rounded-full bg-[#003D3F] text-white text-[13px] font-bold hover:bg-[#0E5B5C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#003D3F]">
                      Continuar
                    </Link>
                  </div>
                </div>
                {/* ProgressBar */}
                <div className="w-full h-1.5 bg-[#FAF7F1] rounded-full overflow-hidden" role="progressbar" aria-valuenow={activeCourse.progressPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-[#003D3F] transition-all duration-500 ease-out rounded-full" style={{ width: `${Math.max(0, Math.min(100, activeCourse.progressPercent))}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] border border-[#DED5C8] p-5 flex flex-col items-center justify-center text-center gap-3">
                <h3 className="font-bold text-[16px] text-[#14172A]">Comece sua jornada</h3>
                <p className="text-[13px] text-[#657080] max-w-[250px]">Explore as formações disponíveis para iniciar seus estudos.</p>
                <Link href="/app/cursos" className="mt-2 h-[40px] px-6 rounded-full bg-[#003D3F] flex items-center justify-center text-white text-[14px] font-bold hover:bg-[#0E5B5C] transition-colors">
                  Ver cursos
                </Link>
              </div>
            )}
          </section>

          {/* SEÇÃO PLANO E ASSINATURA */}
          <section data-profile-subscription>
             <h2 className="text-[20px] font-editorial text-[#14172A] font-bold mb-4 inline-block relative">
              Plano e assinatura
              <div className="absolute -bottom-1 left-0 w-1/3 h-[2px] bg-[#003D3F] rounded-full"></div>
            </h2>
            
            {subscription.status === 'SEM_ASSINATURA' ? (
              <div className="bg-white rounded-[24px] border border-[#DED5C8] p-5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-[#657080] mb-1">
                  <Shield size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[#14172A]">Nenhum plano ativo</h3>
                  <p className="text-[13px] text-[#657080] mt-1">Conheça as vantagens da Academia Completa.</p>
                </div>
                <Link href="/assinatura" className="mt-2 h-[40px] px-6 rounded-full bg-[#003D3F] flex items-center justify-center text-white text-[14px] font-bold hover:bg-[#0E5B5C] transition-colors">
                  Conhecer planos
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] border border-[#DED5C8] p-4 flex items-center gap-4">
                <div className="w-[56px] h-[56px] rounded-[16px] bg-[#003D3F] shrink-0 flex items-center justify-center text-[#E7B64F]">
                  {subscription.status === 'EXPIRADA' || subscription.status === 'PAGAMENTO_PENDENTE' ? (
                    <Lock size={24} strokeWidth={1.5} />
                  ) : (
                    <Shield size={24} strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold text-[#E7B64F] uppercase tracking-widest shrink-0">Plano atual</span>
                    
                    {subscription.status === 'ATIVA' && (
                      <span className="px-2 py-0.5 rounded-full border border-[#E7B64F] text-[#E7B64F] text-[10px] font-bold bg-[#E7B64F]/10">Ativa</span>
                    )}
                    {subscription.status === 'EM_TESTE' && (
                      <span className="px-2 py-0.5 rounded-full border border-[#18864B] text-[#18864B] text-[10px] font-bold bg-[#18864B]/10">Em teste</span>
                    )}
                    {subscription.status === 'CANCELAMENTO_AGENDADO' && (
                      <span className="px-2 py-0.5 rounded-full border border-gray-400 text-gray-600 text-[10px] font-bold bg-gray-100">Cancela em breve</span>
                    )}
                    {subscription.status === 'EXPIRADA' && (
                      <span className="px-2 py-0.5 rounded-full border border-[#D93030] text-[#D93030] text-[10px] font-bold bg-[#D93030]/10">Expirada</span>
                    )}
                    {subscription.status === 'PAGAMENTO_PENDENTE' && (
                      <span className="px-2 py-0.5 rounded-full border border-[#D93030] text-[#D93030] text-[10px] font-bold bg-[#D93030]/10">Pagamento pendente</span>
                    )}

                  </div>
                  <h3 className="font-bold text-[15px] text-[#14172A] truncate leading-tight mb-0.5">{subscription.planName}</h3>
                  
                  {subscription.status === 'ATIVA' && subscription.nextBillingDate && (
                    <p className="text-[12px] text-[#657080] truncate">Renovação em {subscription.nextBillingDate}</p>
                  )}
                  {subscription.status === 'EM_TESTE' && subscription.trialEndDate && (
                    <p className="text-[12px] text-[#657080] truncate">Teste termina em {subscription.trialEndDate}</p>
                  )}
                  {subscription.status === 'CANCELAMENTO_AGENDADO' && subscription.accessEndDate && (
                    <p className="text-[12px] text-[#657080] truncate">Acesso até {subscription.accessEndDate}</p>
                  )}
                </div>
                <div className="shrink-0">
                   {subscription.status === 'EXPIRADA' ? (
                     <Link href="/app/perfil/assinatura" className="flex items-center text-[13px] font-bold text-[#D93030] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D93030] rounded-sm px-1 py-1">
                        Renovar <ChevronRight size={16} />
                     </Link>
                   ) : (
                    <Link href="/app/perfil/assinatura" className="flex items-center text-[13px] font-bold text-[#003D3F] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D3F] rounded-sm px-1 py-1">
                      Gerenciar <ChevronRight size={16} />
                    </Link>
                   )}
                </div>
              </div>
            )}
          </section>

          {/* SEÇÃO CONTA E PREFERÊNCIAS */}
          <section data-profile-settings>
             <h2 className="text-[20px] font-editorial text-[#14172A] font-bold mb-4 inline-block relative">
              Conta e preferências
              <div className="absolute -bottom-1 left-0 w-1/3 h-[2px] bg-[#003D3F] rounded-full"></div>
            </h2>
            <div className="bg-white rounded-[24px] border border-[#DED5C8] overflow-hidden flex flex-col">
               
               <Link href="/app/perfil/editar" className="flex items-center gap-4 p-4 border-b border-[#DED5C8] hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003D3F]">
                 <div className="w-10 h-10 rounded-full bg-[#FAF7F1] border border-[#DED5C8] flex items-center justify-center text-[#003D3F] shrink-0">
                   <User size={18} strokeWidth={1.5} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-[14px] text-[#14172A]">Dados pessoais</h4>
                   <p className="text-[12px] text-[#657080] truncate">Nome, e-mail e telefone</p>
                 </div>
                 <ChevronRight size={18} className="text-gray-400 shrink-0" />
               </Link>
               
               <Link href="/app/perfil/seguranca" className="flex items-center gap-3 sm:gap-4 p-4 border-b border-[#DED5C8] hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003D3F]">
                 <div className="w-10 h-10 rounded-full bg-[#FAF7F1] border border-[#DED5C8] flex items-center justify-center text-[#003D3F] shrink-0">
                   <Shield size={18} strokeWidth={1.5} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-[14px] text-[#14172A]">Segurança e privacidade</h4>
                   <p className="text-[12px] text-[#657080] truncate">Senha e dispositivos conectados</p>
                 </div>
                 <div className="shrink-0 flex items-center gap-2">
                   {identity.securityStatus === 'Protegida' ? (
                     <div className="px-2.5 py-0.5 rounded-full bg-[#18864B]/10 text-[#18864B] text-[11px] font-bold whitespace-nowrap">Protegida</div>
                   ) : (
                     <div className="px-2.5 py-0.5 rounded-full bg-[#E7B64F]/10 text-[#B8871E] text-[11px] font-bold whitespace-nowrap">Revisar</div>
                   )}
                   <ChevronRight size={18} className="text-gray-400" />
                 </div>
               </Link>
               
               <Link href="/app/perfil/notificacoes" className="flex items-center gap-4 p-4 border-b border-[#DED5C8] hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003D3F]">
                 <div className="w-10 h-10 rounded-full bg-[#FAF7F1] border border-[#DED5C8] flex items-center justify-center text-[#003D3F] shrink-0">
                   <BellRing size={18} strokeWidth={1.5} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-[14px] text-[#14172A]">Notificações</h4>
                   <p className="text-[12px] text-[#657080] truncate">Novos cursos e casos clínicos</p>
                 </div>
                 {/* Decorative toggle for UI fidelity, real toggle will be on the page */}
                 <div className="w-10 h-5 rounded-full bg-[#003D3F] relative shrink-0 shadow-inner">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"></div>
                 </div>
               </Link>
               
               <Link href="/app/perfil/acessibilidade" className="flex items-center gap-4 p-4 border-b border-[#DED5C8] hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003D3F]">
                 <div className="w-10 h-10 rounded-full bg-[#FAF7F1] border border-[#DED5C8] flex items-center justify-center text-[#003D3F] shrink-0">
                   <Accessibility size={18} strokeWidth={1.5} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-[14px] text-[#14172A]">Acessibilidade</h4>
                   <p className="text-[12px] text-[#657080] truncate">Texto, contraste e movimento</p>
                 </div>
                 <ChevronRight size={18} className="text-gray-400 shrink-0" />
               </Link>
               
               <Link href="/app/perfil/suporte" className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003D3F]">
                 <div className="w-10 h-10 rounded-full bg-[#FAF7F1] border border-[#DED5C8] flex items-center justify-center text-[#003D3F] shrink-0">
                   <HelpCircle size={18} strokeWidth={1.5} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-[14px] text-[#14172A]">Ajuda e suporte</h4>
                   <p className="text-[12px] text-[#657080] truncate">Central de atendimento</p>
                 </div>
                 <ChevronRight size={18} className="text-gray-400 shrink-0" />
               </Link>
            </div>
            
            <div className="mt-8 flex justify-center pb-2">
              <LogoutButton />
            </div>
          </section>

        </main>
      </div>
      <div data-page-end aria-hidden="true" />
    </div>
  );
}
