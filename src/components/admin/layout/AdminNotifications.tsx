"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Headphones } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminNotifications, type AdminNotification } from "@/app/admin/actions/notifications";

const REFRESH_MS = 60_000;

/** Sino do admin: chamados de suporte esperando resposta. Atualiza ao trocar de tela e a cada minuto. */
export function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ count: number; notifications: AdminNotification[] }>({ count: 0, notifications: [] });
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const load = () => {
      if (document.hidden) return;
      getAdminNotifications().then((d) => { if (active) setData(d); }).catch(() => undefined);
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
  }, [pathname]);

  useEffect(() => {
    const outside = (event: PointerEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={data.count ? `Notificações: ${data.count} chamados esperando resposta` : "Notificações"}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--admin-label)] hover:bg-[var(--admin-fill)]"
      >
        <Bell size={19} aria-hidden="true" />
        {data.count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold leading-none text-white">
            {data.count > 9 ? "9+" : data.count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-black/[.08] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--admin-separator)] px-4 py-3">
            <p className="text-sm font-semibold">Notificações</p>
            <Link href="/admin/support" onClick={() => setOpen(false)} className="text-xs font-semibold text-[var(--admin-tint)]">Ver suporte</Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--admin-secondary)]">Nenhum chamado esperando resposta.</p>
            ) : (
              data.notifications.map((n) => (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="flex gap-3 border-b border-[var(--admin-separator)] px-4 py-3 last:border-0 hover:bg-[var(--admin-fill)]">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1eafb] text-[var(--admin-tint)]"><Headphones size={16} aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="block truncate text-xs text-[var(--admin-secondary)]">{n.description}</span>
                    <span className="block text-[11px] text-[var(--admin-tertiary)]">{new Date(n.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
