"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { currentSection, isActiveRoute } from "./nav-state";

/** Abas da seção aberta (ex.: Alunos → Lista de alunos | Quem tem acesso). */
export default function SectionTabs({ allowedKeys }: { allowedKeys: string[] }) {
  const pathname = usePathname();
  const section = currentSection(pathname, allowedKeys);
  if (!section || section.items.length < 2) return null;
  return (
    <nav aria-label={`Abas de ${section.label}`} className="amf-section-tabs">
      <ul className="flex w-max min-w-0 gap-1 rounded-[12px] bg-[var(--admin-fill)] p-1">
        {section.items.map((item) => {
          const active = isActiveRoute(pathname, item.route);
          return (
            <li key={item.key}>
              <Link
                href={item.route}
                aria-current={active ? "page" : undefined}
                className={twMerge(
                  "flex min-h-9 items-center whitespace-nowrap rounded-[9px] px-3.5 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-white text-[var(--admin-label)] shadow-[0_1px_3px_rgba(0,0,0,.1)]"
                    : "text-[var(--admin-secondary)] hover:text-[var(--admin-label)]",
                )}
              >
                {item.tab || item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
