"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight, X, ShieldCheck } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { adminNavigationRegistry, NavGroup, NavItem } from "@/config/admin-navigation";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  // Group navigation items
  const groupedNav = adminNavigationRegistry.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<NavGroup, NavItem[]>);

  // Function to render mock badges
  const renderBadge = (key: string) => {
    if (key === 'stories') return <span className="ml-auto bg-teal-800 text-teal-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full">4</span>;
    if (key === 'support') return <span className="ml-auto bg-teal-800 text-teal-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full">7</span>;
    return null;
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#12051B] text-cream-50 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-[#2A1B3D]/50",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-[80px]" : "w-[228px]"
        )}
      >
        <div className="flex items-center justify-between h-[72px] px-5 shrink-0">
          <div className={twMerge("flex flex-col overflow-hidden", isCollapsed ? "lg:items-center lg:w-full" : "")}>
            <span className={twMerge("font-serif text-[28px] leading-none text-[#D4AF37] tracking-wide", isCollapsed ? "text-xl" : "")}>
              AMF
            </span>
            {!isCollapsed && (
              <span className="text-[11px] font-medium text-cream-100/60 mt-1 uppercase tracking-wider">
                Central Administrativa
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 lg:hidden text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden px-3 space-y-6 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} className="space-y-1">
              {!isCollapsed && group !== 'Painel' && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-3 mt-4">
                  {group}
                </div>
              )}
              {items.map((item) => {
                const isActive = pathname === item.route || pathname?.startsWith(`${item.route}/`);
                return (
                  <Link
                    key={item.key}
                    href={item.route}
                    className={twMerge(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative",
                      isActive 
                        ? "bg-teal-900/30 text-cream-50" 
                        : "text-cream-100/70 hover:bg-white/5 hover:text-cream-50"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className={twMerge("shrink-0", isActive ? "text-[#D4AF37]" : "text-cream-100/60 group-hover:text-cream-50")} />
                    <span className={twMerge("whitespace-nowrap transition-opacity text-[13px] font-medium", isCollapsed ? "lg:hidden" : "block")}>
                      {item.label}
                    </span>
                    
                    {!isCollapsed && renderBadge(item.key)}

                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#D4AF37] rounded-r-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 shrink-0 bg-black/10">
          <div className={twMerge("flex items-center gap-3 mb-4", isCollapsed ? "lg:justify-center" : "")}>
            <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-cream-50 font-bold shrink-0 shadow-inner">
              DR
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-cream-50 truncate">Dra. Polyana</span>
                <span className="text-[11px] text-cream-100/50 truncate flex items-center gap-1">
                  Superadministradora
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-2 px-1 text-[11px] text-teal-400 mb-4">
              <ShieldCheck size={14} />
              <span>Sessão protegida</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-cream-100/50 hover:bg-white/5 hover:text-cream-50 rounded-lg transition-colors"
              title="Recolher menu"
            >
              {isCollapsed ? <ChevronRight size={16} /> : (
                <>
                  <ChevronLeft size={16} />
                  <span className="text-xs">Recolher</span>
                </>
              )}
            </button>
            <button className="flex items-center justify-center py-2 px-3 text-cream-100/50 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
