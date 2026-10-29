"use client";
import { Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentNavItem } from "./nav-state";
export default function Header({ allowedKeys }: { allowedKeys: string[] }) {
  const pathname = usePathname();
  const current = currentNavItem(pathname);
  return (
    <header className="amf-glass sticky top-0 z-20 flex min-h-[56px] shrink-0 items-center justify-between gap-3 border-b border-black/[.08] px-4 pt-[env(safe-area-inset-top)] md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <span className="font-serif text-lg text-[var(--admin-tint)] lg:hidden" aria-hidden="true">AMF</span>
        <p className="truncate text-[15px] font-semibold text-[var(--admin-label)]">
          {current?.label || "Editor"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--admin-tint)] hover:bg-[var(--admin-fill)]"
        >
          <span className="hidden sm:inline">Ver aplicativo</span>
          <span className="sm:hidden">App</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        {allowedKeys.includes("stories") && (
          <Link
            href="/admin/stories"
            className="hidden min-h-10 items-center gap-1.5 rounded-full bg-[var(--admin-tint)] px-4 text-sm font-semibold text-white hover:bg-[var(--admin-tint-hover)] sm:flex"
          >
            <Plus size={16} aria-hidden="true" />
            Novo story
          </Link>
        )}
      </div>
    </header>
  );
}
