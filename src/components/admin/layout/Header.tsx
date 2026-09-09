"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, Bell, Plus, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { adminNavigationRegistry } from "@/config/admin-navigation";
import { twMerge } from "tailwind-merge";

interface HeaderProps {
  toggleSidebar: () => void;
}

const QUICK_CREATE_ITEMS = [
  { label: 'Novo Artigo', href: '/admin/home' },
  { label: 'Novo Caso Clínico', href: '/admin/cases' },
  { label: 'Novo Curso', href: '/admin/courses/editor/new' },
] as const;

export default function Header({ toggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock permission — in production this would come from auth context
  const hasPermissionToPublish = true;

  const currentNavItem = adminNavigationRegistry.find(item =>
    pathname === item.route || (item.route !== '/admin' && pathname?.startsWith(item.route))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  const handleQuickCreate = (href: string) => {
    setIsDropdownOpen(false);
    router.push(href);
  };

  return (
    <header className="h-[72px] flex items-center justify-between px-6 bg-[#1A0B2E] text-cream-50 shrink-0 z-30 relative w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-cream-100 hover:text-white hover:bg-white/5 rounded-lg lg:hidden"
          aria-label="Abrir menu"
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
        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-[#2A1B3D]/50 border border-[#3A2B4D] px-3 py-1.5 rounded-md text-[13px]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-cream-100/80">Produção</span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-cream-100/70 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-[#1A0B2E]">
            12
          </span>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-inner cursor-pointer hover:opacity-90">
          DR
        </div>

        {/* Nova Publicação dropdown */}
        {hasPermissionToPublish && (
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
              className="flex items-center gap-2 bg-[#0F766E] hover:bg-teal-700 text-white px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Nova publicação</span>
              <ChevronDown
                size={14}
                className={twMerge("transition-transform duration-200", isDropdownOpen && "rotate-180")}
              />
            </button>

            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 mt-2 w-52 bg-white text-amf-ink-900 rounded-xl shadow-xl border border-amf-border py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {QUICK_CREATE_ITEMS.map((item) => (
                  <button
                    key={item.href}
                    role="menuitem"
                    onClick={() => handleQuickCreate(item.href)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-amf-ivory-100 transition-colors flex items-center gap-2 text-amf-ink-900"
                  >
                    <Plus size={14} className="text-amf-petrol-700 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
