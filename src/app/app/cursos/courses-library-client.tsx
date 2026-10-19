'use client';

import React, { useState, useMemo, useRef } from 'react';
import { CourseLibraryItem } from '@/lib/models/courses';
import { Search, SlidersHorizontal, X, ChevronRight, Lock } from 'lucide-react';
import { MemberHeaderActions } from '@/app/app/member-header-actions';
import Image from 'next/image';
import Link from 'next/link';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

type TabType = 'Explorar' | 'Meus cursos' | 'Assinaturas' | 'Em andamento';

interface CoursesLibraryClientProps {
  products: CourseLibraryItem[];
}

export function CoursesLibraryClient({ products }: CoursesLibraryClientProps) {
  // 1. States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('Explorar');
  const [activeSpecialty, setActiveSpecialty] = useState<string>('Todos');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 2. Extracted Specialties
  const specialties = useMemo(() => {
    const specs = new Set<string>();
    products.forEach(p => {
      if (p.isPublished && p.specialty) {
        specs.add(p.specialty);
      }
    });
    return ['Todos', ...Array.from(specs)];
  }, [products]);

  // 3. Filtering logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isPublished) return false;
      if (activeTab === 'Meus cursos') {
        if (!['unlocked', 'in_progress', 'active_subscription'].includes(p.accessState)) return false;
      } else if (activeTab === 'Assinaturas') {
        if (p.productType !== 'subscription' || !p.isActiveSubscription) return false;
      } else if (activeTab === 'Em andamento') {
        if (p.accessState === 'locked' || (p.progressPercent || 0) <= 0 || (p.progressPercent || 0) >= 100) return false;
      }
      if (activeSpecialty !== 'Todos' && p.specialty !== activeSpecialty) return false;
      if (searchQuery) {
        const query = normalize(searchQuery);
        const searchTarget = normalize(`${p.title} ${p.description || ''} ${p.specialty || ''} ${p.level || ''} ${p.productType}`);
        if (!searchTarget.includes(query)) return false;
      }
      return true;
    });
  }, [products, activeTab, activeSpecialty, searchQuery]);

  // 3.5 Sorting logic (In Progress > Unlocked > Active Sub > Others > Locked)
  const getSortWeight = (p: CourseLibraryItem) => {
    if (p.accessState === 'in_progress') return 1;
    if (p.accessState === 'unlocked') return 2;
    if (p.accessState === 'active_subscription') return 3;
    if (p.accessState === 'locked') return 5;
    return 4; // Outros
  };

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => getSortWeight(a) - getSortWeight(b));
  }, [filteredProducts]);

  // 4. Dynamic Counters
  const countCourses = products.filter(p => p.productType === 'course' && p.isPublished).length;
  const countSubscriptions = products.filter(p => p.productType === 'subscription' && p.isActiveSubscription && p.isPublished).length;
  const countInProgress = products.filter(p => p.accessState !== 'locked' && p.isPublished && (p.progressPercent || 0) > 0 && (p.progressPercent || 0) < 100).length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF7F1] min-w-0" data-page="courses-library" data-layout-revision="courses-premium-shell-v2">
      {/* HEADER PREMIUM FULL-BLEED */}
      <header className="amf-member-header w-full bg-[#160820] text-white pt-10 sm:pt-14 pb-12 relative overflow-hidden shrink-0" data-premium-header>
        <div className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10">
          <Image src="/assets/amf-home/header-feline-lineart.svg" alt="" fill className="object-cover object-right-top" priority sizes="(max-width: 768px) 100vw, 66vw" />
        </div>
        
        <div className="w-full max-w-4xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-8">
            <div className="font-editorial text-2xl font-bold text-[#E7B64F] tracking-widest leading-none justify-self-start">AMF</div>
            <div className="font-sans font-medium text-white/90 text-[15px] justify-self-center">Cursos</div>
            <div className="justify-self-end"><MemberHeaderActions compact /></div>
          </div>
          
          <h1 className="amf-page-heading font-editorial text-white leading-tight mb-2" style={{ fontSize: 'clamp(28px, 6vw, 36px)' }}>Biblioteca clínica</h1>
          <p className="text-white/70 text-[15px] font-sans font-light mb-6">Encontre a formação certa para sua rotina</p>
          
          <div className="w-full h-[48px] bg-white rounded-xl flex items-center px-4 gap-3 text-gray-400 mb-8 focus-within:ring-2 focus-within:ring-[#0E5B5C] transition-all" data-courses-search>
            <Search size={20} className="shrink-0" />
            <input 
              ref={searchInputRef}
              aria-label="Buscar cursos"
              type="text" 
              className="amf-field flex-1 bg-transparent text-[#151329] text-[15px] outline-none placeholder-gray-400 w-full min-w-0"
              placeholder="Buscar por curso, tema ou especialidade"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 shrink-0"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="amf-header-metrics flex w-full divide-x divide-[#E7B64F]/20">
            <div className="flex-1 flex flex-col items-center min-w-0">
              <span className="text-xl font-bold leading-none mb-1">{countCourses}</span>
              <span className="text-xs text-white/60 truncate w-full text-center">curso{countCourses !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex-1 flex flex-col items-center min-w-0">
              <span className="text-xl font-bold leading-none mb-1">{countSubscriptions}</span>
              <span className="text-xs text-white/60 truncate w-full text-center">assinatura{countSubscriptions !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex-1 flex flex-col items-center min-w-0">
              <span className="text-xl font-bold leading-none mb-1">{countInProgress}</span>
              <span className="text-xs text-white/60 truncate w-full text-center">em andamento</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* PAINEL CREME (MAIN CONTENT) */}
      <div className="w-full flex-1 bg-[#FAF7F1] rounded-t-[28px] -mt-6 relative z-20 flex flex-col min-w-0">
        <main className="w-full max-w-4xl mx-auto px-6 pt-6 flex-1 flex flex-col min-w-0 pb-16" data-courses-main>
        
        <div className="mb-5 flex shrink-0 gap-1 overflow-x-auto rounded-[20px] bg-[#F1E8D9] p-1 scrollbar-hide" role="tablist" aria-label="Seções da biblioteca" data-courses-tabs>
          {(['Explorar', 'Meus cursos', 'Assinaturas', 'Em andamento'] as TabType[]).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button 
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={`min-h-11 min-w-max flex-1 px-3 py-2.5 rounded-[16px] text-[14px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D3F] truncate ${isActive ? 'bg-[#003D3F] text-white font-bold shadow-sm' : 'text-[#151329] font-medium hover:bg-black/5'}`}
              >
                {tab}
              </button>
            )
          })}
        </div>
        
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide shrink-0">
          {specialties.map(spec => {
            const isActive = activeSpecialty === spec;
            return (
              <button 
                key={spec}
                onClick={() => setActiveSpecialty(spec)}
                className={`px-4 h-[32px] rounded-full text-[13px] whitespace-nowrap shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D3F] ${isActive ? 'bg-[#003D3F] text-white font-bold' : 'border border-[#DED5C8] bg-transparent text-[#151329] font-medium hover:bg-[#F1E8D9]'}`}
              >
                {spec}
              </button>
            );
          })}
          <button 
            className="w-[32px] h-[32px] rounded-full border border-[#DED5C8] flex items-center justify-center text-[#151329] shrink-0 hover:bg-[#F1E8D9] transition-colors ml-1"
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Filtros avançados"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
        
        {/* Catálogo Completo */}
        {sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-400 mb-4 shadow-sm border border-[#DED5C8]">
              <Search size={28} />
            </div>
                <h2 className="amf-section-heading text-xl font-editorial font-bold text-[#160820] mb-2">{activeTab === 'Em andamento' ? 'Nenhum curso em andamento' : activeTab === 'Assinaturas' ? 'Nenhuma assinatura ativa' : 'Nenhuma formação encontrada'}</h2>
            <p className="text-sm text-[#657080] font-sans mb-6 max-w-sm">
              Tente ajustar sua busca ou remover alguns filtros para encontrar o que procura.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveSpecialty('Todos'); }}
              className="px-6 py-2.5 rounded-[12px] bg-[#0E5B5C] text-white font-bold text-[14px] active:scale-95 transition-transform"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <section className="flex-col flex min-w-0" data-course-catalog>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="amf-section-heading text-[18px] font-editorial text-[#160820] font-bold">
                {activeTab === 'Meus cursos' ? 'Meus acessos' : activeTab === 'Assinaturas' ? 'Planos de assinatura' : 'Todos os cursos'}
              </h2>
              <span className="text-[12px] text-[#657080] font-sans">{sortedProducts.length} formação{sortedProducts.length !== 1 ? 'ões' : ''}</span>
            </div>
            
            <div className="amf-course-grid flex flex-col gap-3 min-w-0">
              {sortedProducts.map(p => {
                
                // Configuração Visual do Tipo de Produto (Curso, Pacote, Assinatura)
                let typeLabel = '';
                let typeColor = '';
                if (p.productType === 'course') { typeLabel = 'CURSO'; typeColor = 'text-[#160820]'; }
                else if (p.productType === 'subscription') { typeLabel = p.billingInterval === 'month' ? 'ASSINATURA MENSAL' : 'ASSINATURA'; typeColor = 'text-[#0E5B5C]'; }
                else if (p.productType === 'bundle') { typeLabel = 'FERRAMENTA'; typeColor = 'text-[#0E5B5C]'; }

                // Configuração Visual do Estado de Acesso
                let accessNode = null;
                if (p.accessState === 'locked') {
                  accessNode = (
                    <div className="flex items-center gap-1.5 text-gray-400 mt-1.5">
                      <Lock size={12} />
                      <span className="text-[12px] font-medium">Bloqueado</span>
                    </div>
                  );
                } else if (p.accessState === 'active_subscription') {
                  accessNode = (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#E7B64F]/15 text-[#B8860B] text-[11px] font-bold mt-1.5 uppercase tracking-wide">
                      Ativa
                    </div>
                  );
                } else if (p.accessState === 'unlocked') {
                  accessNode = (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#0E5B5C]/10 text-[#0E5B5C] text-[11px] font-bold mt-1.5 uppercase tracking-wide">
                      Liberado
                    </div>
                  );
                } else if (p.accessState === 'in_progress') {
                  accessNode = (
                    <div className="flex items-center gap-2 mt-1.5 min-w-0">
                      <div className="flex-1 max-w-[60px] h-1 bg-[#F1E8D9] rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-[#0E5B5C] rounded-full" style={{ width: `${Math.max(0, Math.min(100, p.progressPercent || 0))}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-[#0E5B5C] shrink-0">{p.progressPercent}%</span>
                    </div>
                  );
                }

                return (
                  <Link key={p.id} href={p.destinationUrl} className="group block outline-none focus-visible:ring-2 focus-visible:ring-[#0E5B5C] rounded-[16px] min-w-0">
                    <div className="w-full bg-white rounded-[16px] border border-[#DED5C8] p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#0E5B5C]/30 transition-colors grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center min-w-0">
                      
                      {/* Imagem */}
                      <div className="col-span-2 aspect-video bg-gray-200 rounded-[10px] relative overflow-hidden shrink-0">
                        {p.coverUrl && <Image src={p.coverUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 700px" />}
                      </div>
                      
                      {/* Info Central */}
                      <div className="flex flex-col min-w-0 justify-center">
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${typeColor} mb-0.5 truncate`}>
                          {typeLabel}
                        </div>
                        <h3 className="text-[14px] font-bold text-[#160820] line-clamp-2 mb-0.5 leading-snug" title={p.title}>
                          {p.title}
                        </h3>
                        <div className="text-[12px] text-[#657080] font-medium truncate">
                          {p.moduleCount ? `${p.moduleCount} módulos` : p.description}
                        </div>
                        {accessNode}
                      </div>
                      
                      {/* Chevron */}
                      <div className="pr-1 text-gray-300 group-hover:text-[#0E5B5C] transition-colors shrink-0 flex items-center justify-center">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
      </div>

      {/* MODAL DE FILTRO */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#160820]/40 backdrop-blur-sm">
          <div className="w-full sm:w-[400px] bg-white rounded-t-[24px] sm:rounded-[24px] overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="amf-list-row flex justify-between items-center p-5 border-b border-[#DED5C8]">
              <h3 className="font-editorial text-lg font-bold text-[#160820]">Filtrar e Ordenar</h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="mb-6">
                <label className="text-[13px] font-bold text-[#160820] uppercase tracking-wider block mb-3">Ordenar por</label>
                <div className="flex flex-col gap-2">
                  {['Relevância', 'Mais recentes', 'A-Z', 'Em andamento primeiro'].map(opt => (
                    <label key={opt} className="flex items-center gap-3">
                      <input type="radio" name="sort" className="amf-field w-4 h-4 text-[#0E5B5C] focus:ring-[#0E5B5C] border-gray-300" defaultChecked={opt === 'Em andamento primeiro'} />
                      <span className="text-[15px] text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#DED5C8] bg-gray-50 flex gap-3">
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="amf-widget flex-1 py-3 rounded-xl border border-[#DED5C8] text-[#151329] font-bold text-[15px] bg-white"
              >
                Limpar
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-[2] py-3 rounded-xl bg-[#0E5B5C] text-white font-bold text-[15px]"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {isFilterModalOpen && (
        <style dangerouslySetInnerHTML={{ __html: `body { overflow: hidden; }` }} />
      )}

      <div data-page-end aria-hidden="true" />
    </div>
  );
}
