"use client";

import React, { useEffect } from "react";
import { logout } from "@/app/admin/actions/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen, X, ShieldCheck, ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { adminNavigationRegistry, NavGroup, NavItem } from "@/config/admin-navigation";
import { isActiveRoute } from "./nav-state";

interface SidebarProps {
  name: string;
  allowedKeys: string[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

/**
 * Desktop: barra lateral clara no estilo macOS. Celular e tablet: a mesma lista
 * abre como folha de baixo para cima pelo botão "Mais" da barra de abas.
 */
export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, name, allowedKeys }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setIsOpen]);

  const groupedNav = adminNavigationRegistry
    .filter((item) => allowedKeys.includes(item.key))
    .reduce(
      (acc, item) => {
        (acc[item.group] ||= []).push(item);
        return acc;
      },
      {} as Record<NavGroup, NavItem[]>,
    );

  return (
    <>
      <div
        aria-hidden="true"
        className={twMerge(
          "fixed inset-0 z-40 bg-black/25 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside
        aria-label="Menu da administração"
        className={twMerge(
          "amf-sidebar-glass fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[22px] shadow-[0_-8px_40px_rgba(0,0,0,.12)] transition-transform duration-300 ease-out",
          "lg:static lg:inset-auto lg:max-h-none lg:translate-y-0 lg:rounded-none lg:border-r lg:border-black/[.08] lg:shadow-none",
          isOpen ? "translate-y-0" : "translate-y-full",
          isCollapsed ? "lg:w-[76px]" : "lg:w-[260px]",
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-black/15 lg:hidden" aria-hidden="true" />
        <div className={twMerge("flex h-[60px] shrink-0 items-center justify-between px-5", isCollapsed && "lg:justify-center lg:px-0")}>
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="font-serif text-[24px] leading-none text-[var(--admin-tint)]">AMF</span>
            <span className={twMerge("truncate text-[13px] font-medium text-[var(--admin-secondary)]", isCollapsed && "lg:hidden")}>Administração</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
            className="grid h-11 w-11 place-items-center rounded-full bg-black/5 text-[var(--admin-secondary)] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 pb-4 lg:px-2.5" style={{ scrollbarWidth: "thin" }}>
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              {group !== "Painel" && (
                <p className={twMerge("mb-1 px-3 text-[12px] font-semibold text-[var(--admin-tertiary)]", isCollapsed && "lg:sr-only")}>{group}</p>
              )}
              <ul className="overflow-hidden rounded-[14px] bg-white lg:rounded-none lg:bg-transparent">
                {items.map((item) => {
                  const active = isActiveRoute(pathname, item.route);
                  return (
                    <li key={item.key} className="border-b border-black/[.06] last:border-0 lg:border-0">
                      <Link
                        href={item.route}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsOpen(false)}
                        title={isCollapsed ? item.label : undefined}
                        className={twMerge(
                          "flex min-h-[48px] items-center gap-3 px-3 text-[15px] transition-colors lg:my-0.5 lg:min-h-[36px] lg:rounded-[9px] lg:text-[13.5px]",
                          isCollapsed && "lg:justify-center lg:px-0",
                          active
                            ? "font-semibold text-[var(--admin-tint)] lg:bg-[var(--admin-tint-soft)]"
                            : "text-[var(--admin-label)] hover:bg-black/[.04]",
                        )}
                      >
                        <span
                          className={twMerge(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-[8px] lg:h-auto lg:w-auto lg:rounded-none lg:bg-transparent",
                            active ? "bg-[var(--admin-tint)] text-white lg:text-[var(--admin-tint)]" : "bg-[var(--admin-fill)] text-[var(--admin-secondary)]",
                          )}
                        >
                          <item.icon size={17} aria-hidden="true" />
                        </span>
                        <span className={twMerge("flex-1 truncate", isCollapsed && "lg:hidden")}>{item.label}</span>
                        <ChevronRight size={16} className="text-[#c7c7cc] lg:hidden" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-black/[.06] p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className={twMerge("flex items-center gap-3 px-1", isCollapsed && "lg:justify-center lg:px-0")}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#3fa7a0] to-[var(--admin-tint)] text-[13px] font-semibold text-white">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div className={twMerge("min-w-0 flex-1", isCollapsed && "lg:hidden")}>
              <p className="truncate text-[13px] font-semibold text-[var(--admin-label)]">{name}</p>
              <p className="flex items-center gap-1 text-[11.5px] text-[var(--admin-secondary)]">
                <ShieldCheck size={12} aria-hidden="true" /> Sessão protegida
              </p>
            </div>
            <form action={logout} className={twMerge(isCollapsed && "lg:hidden")}>
              <button
                type="submit"
                aria-label="Sair da conta"
                title="Sair"
                className="grid h-11 w-11 place-items-center rounded-full text-[var(--admin-secondary)] hover:bg-red-50 hover:text-[var(--admin-danger)]"
              >
                <LogOut size={17} />
              </button>
            </form>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-2 hidden min-h-9 w-full items-center justify-center gap-2 rounded-[9px] text-[12.5px] text-[var(--admin-secondary)] hover:bg-black/[.04] lg:flex"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : (<><PanelLeftClose size={17} /> Recolher</>)}
          </button>
        </div>
      </aside>
    </>
  );
}
