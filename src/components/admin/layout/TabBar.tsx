"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { isActiveRoute, tabItems } from "./nav-state";

const SHORT_LABELS: Record<string, string> = {
  dashboard: "Início",
  communications: "Avisos",
  users: "Usuários",
  courses: "Cursos",
  support: "Suporte",
  cases: "Casos",
  access: "Acessos",
};

export default function TabBar({ allowedKeys, onMore }: { allowedKeys: string[]; onMore: () => void }) {
  const pathname = usePathname();
  const tabs = tabItems(allowedKeys);
  const onTab = tabs.some((item) => isActiveRoute(pathname, item.route));
  return (
    <nav
      aria-label="Navegação principal"
      className="amf-admin-tabbar amf-glass fixed inset-x-0 bottom-0 z-30 border-t border-black/[.08] lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-2">
        {tabs.map((item) => {
          const active = isActiveRoute(pathname, item.route);
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.route}
                aria-current={active ? "page" : undefined}
                className={twMerge(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium",
                  active ? "text-[var(--admin-tint)]" : "text-[#8e8e93]",
                )}
              >
                <Icon size={23} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                {SHORT_LABELS[item.key] || item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onMore}
            className={twMerge(
              "flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium",
              onTab ? "text-[#8e8e93]" : "text-[var(--admin-tint)]",
            )}
          >
            <MoreHorizontal size={23} aria-hidden="true" />
            Mais
          </button>
        </li>
      </ul>
    </nav>
  );
}
