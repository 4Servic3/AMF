"use client";

import React, { useState } from "react";
import { Menu, Bell, Search, Plus, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { adminNavigationRegistry } from "@/config/admin-navigation";
import { twMerge } from "tailwind-merge";
import { GlobalSearch } from "./GlobalSearch";
import { AdminNotifications } from "./AdminNotifications";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock permission
  const hasPermissionToPublish = true; 

  const currentNavItem = adminNavigationRegistry.find(item => 
    pathname === item.route || (item.route !== '/admin' && pathname?.startsWith(item.route))
  );

  return (
    <header className="h-[72px] flex items-center justify-between px-6 bg-[#1A0B2E] text-cream-50 shrink-0 z-30 relative w-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-cream-100 hover:text-white hover:bg-white/5 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>

        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center text-[13px] font-medium text-cream-100/70">
          <span>Admin /&nbsp;</span>
          <span className="text-white">{currentNavItem ? currentNavItem.label : "Painel de controle"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center relative w-[280px]">
          <Search size={14} className="absolute left-3 text-cream-100/50" />
          <input 
            type="text" 
            placeholder="Pesquisar em toda a plataforma" 
            className="w-full bg-[#2A1B3D]/50 border border-[#3A2B4D] rounded-md py-1.5 pl-9 pr-10 text-[13px] text-white placeholder-cream-100/40 focus:outline-none focus:border-teal-500/50 transition-colors"
          />
          <div className="absolute right-2 flex items-center gap-0.5 text-[10px] text-cream-100/40 font-mono bg-white/5 px-1.5 py-0.5 rounded">
            <span>⌘</span><span>K</span>
          </div>
        </div>

        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-[#2A1B3D]/50 border border-[#3A2B4D] px-3 py-1.5 rounded-md text-[13px]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-cream-100/80">Produção</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-cream-100/70 hover:text-white hover:bg-white/5 rounded-full transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-[#1A0B2E]">
            12
          </span>
        </button>

        {/* Avatar DR */}
        <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-inner cursor-pointer hover:opacity-90">
          DR
        </div>

        {/* Nova Publicação */}
        {hasPermissionToPublish && (
          <div className="relative hidden sm:block">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#0F766E] hover:bg-teal-700 text-white px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Nova publicação</span>
              <ChevronDown size={14} className={twMerge("transition-transform", isDropdownOpen && "rotate-180")} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white text-ink rounded-md shadow-lg border border-border py-1 z-50">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-cream-50 transition-colors">Novo Artigo</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-cream-50 transition-colors">Novo Caso Clínico</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-cream-50 transition-colors">Nova Aula</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
