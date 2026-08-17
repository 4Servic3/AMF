'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, GraduationCap, Library, UserRound, LogOut } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  
  // Rotas principais
  const navItems = [
    { label: 'Início', href: '/app', icon: Home, exact: true },
    { label: 'Casos', href: '/app/casos', icon: Search, exact: false },
    // Academia é tratado separadamente no mobile
    { label: 'Cursos', href: '/app/cursos', icon: Library, exact: false },
    { label: 'Perfil', href: '/app/perfil', icon: UserRound, exact: false },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* =========================================
          DESKTOP SIDEBAR (>= 1024px)
          ========================================= */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 bg-[#160B24] border-r border-[#D4AD62]/20 z-40 transition-all duration-300 w-[84px] xl:w-[240px]">
        {/* Header da Sidebar */}
        <div className="h-20 flex items-center justify-center xl:justify-start xl:px-6 pt-4">
          <div className="font-editorial text-[28px] font-bold text-[#D4AD62] tracking-wider leading-none">
            AMF
          </div>
          <div className="hidden xl:block ml-3 font-sans text-xs font-semibold text-white/80 leading-tight">
            Academia de<br />Medicina Felina
          </div>
        </div>

        {/* Links principais */}
        <nav className="flex-1 mt-8 px-3 xl:px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link 
                key={item.label}
                href={item.href}
                className={`relative flex items-center xl:justify-start justify-center h-12 rounded-xl transition-all duration-[200ms] cubic-bezier(0.2, 0.8, 0.2, 1) group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] ${
                  active 
                    ? 'bg-[#D4AD62]/12 text-[#D4AD62]' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title={item.label} // Tooltip nativo para quando está recolhido
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#D4AD62] rounded-r-full" />
                )}
                <div className="flex items-center justify-center w-10">
                  <item.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                </div>
                <span className={`hidden xl:block ml-2 font-sans text-[14px] font-medium ${active ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Academia Desktop Item */}
          <Link 
            href="/app/academia"
            className={`relative flex items-center xl:justify-start justify-center h-12 rounded-xl transition-all duration-[200ms] group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] ${
              isActive('/app/academia', false) 
                ? 'bg-[#D4AD62]/12 text-[#D4AD62]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Academia"
          >
            {isActive('/app/academia', false) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#D4AD62] rounded-r-full" />
            )}
            <div className="flex items-center justify-center w-10">
              <GraduationCap size={22} strokeWidth={isActive('/app/academia', false) ? 2.5 : 1.5} />
            </div>
            <span className={`hidden xl:block ml-2 font-sans text-[14px] font-medium ${isActive('/app/academia', false) ? 'font-bold' : ''}`}>
              Academia
            </span>
          </Link>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-3 xl:p-4 border-t border-white/10 flex flex-col gap-2">
          <button 
            className="flex items-center xl:justify-start justify-center h-12 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            title="Sair"
          >
            <div className="flex items-center justify-center w-10">
              <LogOut size={20} strokeWidth={1.5} />
            </div>
            <span className="hidden xl:block ml-2 font-sans text-[14px] font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          MOBILE BOTTOM NAVIGATION (< 1024px)
          ========================================= */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-2 sm:px-4 w-full"
        style={{
          background: 'rgba(250, 247, 241, 0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(120, 102, 78, 0.20)',
          height: 'calc(74px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxSizing: 'border-box'
        }}
        data-bottom-navigation="true"
      >
        <NavItemMobile 
          href="/app" 
          icon={Home} 
          label="Início" 
          active={isActive('/app', true)} 
        />
        <NavItemMobile 
          href="/app/casos" 
          icon={Search} 
          label="Casos" 
          active={isActive('/app/casos', false)} 
        />
        
        {/* Botão Central de Destaque (Academia) */}
        <div className="flex-1 flex justify-center items-center h-full relative">
          <Link 
            href="/app/academia"
            className="absolute -top-[20px] flex flex-col items-center justify-center w-[64px] h-[64px] bg-[#30183D] rounded-full shadow-[0_4px_12px_rgba(48,24,61,0.3)] transition-transform duration-[160ms] active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F1]"
            aria-label="Academia"
          >
            <GraduationCap size={24} strokeWidth={2} className="text-[#D4AD62] mb-0.5" />
            <span className="text-[10px] font-sans font-semibold text-[#D4AD62]">Academia</span>
          </Link>
        </div>

        <NavItemMobile 
          href="/app/cursos" 
          icon={Library} 
          label="Cursos" 
          active={isActive('/app/cursos', false)} 
        />
        <NavItemMobile 
          href="/app/perfil" 
          icon={UserRound} 
          label="Perfil" 
          active={isActive('/app/perfil', false)} 
        />
      </nav>
      
      {/* Global Transition Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}} />
    </>
  );
}

function NavItemMobile({ href, icon: Icon, label, active }: { href: string, icon: React.ElementType, label: string, active: boolean }) {
  return (
    <Link 
      href={href}
      className="flex-1 flex flex-col items-center justify-center min-w-[44px] min-h-[44px] h-full gap-1 transition-transform duration-[160ms] active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5B5C] rounded-lg"
    >
      <Icon 
        size={24} 
        strokeWidth={active ? 2.5 : 1.5} 
        className={active ? 'text-[#0E5B5C]' : 'text-[#78664E]'} 
        style={{ transition: 'color 160ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      />
      <span 
        className={`font-sans text-[11px] ${active ? 'font-bold text-[#0E5B5C]' : 'font-medium text-[#78664E]'}`}
        style={{ transition: 'color 160ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        {label}
      </span>
    </Link>
  );
}
