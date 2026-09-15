"use client";
import { Menu, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigationRegistry } from "@/config/admin-navigation";
export default function Header({
  toggleSidebar,
  allowedKeys,
}: {
  toggleSidebar: () => void;
  allowedKeys: string[];
}) {
  const pathname = usePathname();
  const current = adminNavigationRegistry.find(
    (item) =>
      pathname === item.route ||
      (item.route != "/admin" && pathname.startsWith(item.route + "/")),
  );
  return (
    <header className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#1A0B2E] px-4 text-white md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          className="rounded-xl p-2 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[.18em] text-[#d1c3a5]">
            AMF · Administração
          </p>
          <p className="text-sm font-medium">{current?.label || "Editor"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/app"
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-white/80"
        >
          Ver aplicativo <ArrowUpRight size={16} />
        </Link>
        {allowedKeys.includes("stories") && (
          <Link
            href="/admin/stories"
            className="hidden min-h-11 items-center gap-2 rounded-xl bg-[#0f615f] px-4 text-sm sm:flex"
          >
            <Plus size={16} />
            Novo story
          </Link>
        )}
      </div>
    </header>
  );
}
