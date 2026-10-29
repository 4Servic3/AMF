import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { adminNavigationRegistry } from "@/config/admin-navigation";
export default async function Dashboard() {
  await requirePermission("dashboard.read");
  const db = createServiceRoleClient();
  const sources: Record<string, string> = {
    home_banners: "home_banners",
    stories: "case_story_videos",
    cases: "cases",
    courses: "courses",
    academy: "academy_paths",
    users: "profiles",
    access: "entitlements",
    subscriptions: "subscriptions",
    support: "support_tickets",
    media: "media_assets",
    certificates: "certificates",
    communications: "notification_campaigns",
    monitoring: "background_jobs",
    audit: "admin_audit_logs",
  };
  const areas = await Promise.all(
    adminNavigationRegistry
      .filter((item) => item.key !== "dashboard")
      .map(async (item) => {
        if (!(await hasPermission(item.permission))) return null;
        let count: number | null = null,
          failed = false;
        if (sources[item.key]) {
          const result = await db
            .from(sources[item.key])
            .select("*", { head: true, count: "exact" });
          count = result.count;
          failed = !!result.error;
        }
        return { ...item, count, failed };
      }),
  );
  return (
    <div className="space-y-8">
      <section className="pt-2">
        <p className="text-[13px] font-semibold uppercase tracking-[.08em] text-[var(--admin-tint)]">
          Seu espaço de gestão
        </p>
        <h1 className="mt-1 text-[34px] md:text-[44px]">Central de operações</h1>
        <p className="mt-2 max-w-xl text-[17px] text-[var(--admin-secondary)]">
          Conteúdos, alunos e atendimento, organizados em um só lugar.
        </p>
      </section>
      <div>
        <h2 className="text-[22px]">Áreas da plataforma</h2>
        <p className="mt-1 text-[15px] text-[var(--admin-secondary)]">
          Contagens atuais de registros. Escolha uma área para gerenciar.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {areas.filter(Boolean).map((item) => {
          if (!item) return null;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.route}
              className="amf-panel group flex items-center gap-4 transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-[var(--admin-tint-soft)] text-[var(--admin-tint)]">
                <Icon size={24} />
              </span>
              <div>
                <h2 className="text-[17px]">{item.label}</h2>
                <p className="mt-1 text-sm text-[#6e6e73]">
                  {item.failed
                    ? "Configuração pendente"
                    : item.count === null
                      ? "Abrir gerenciamento"
                      : item.count.toLocaleString("pt-BR") + " registros"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
