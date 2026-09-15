import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { adminNavigationRegistry } from "@/config/admin-navigation";
import PageHeader from "@/components/admin/ui/PageHeader";
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
      <section className="rounded-3xl bg-[#1A0B2E] p-6 text-white md:p-10">
        <p className="mb-3 text-xs uppercase tracking-[.2em] text-[#d1c3a5]">
          Seu espaço de gestão
        </p>
        <h1 className="text-3xl md:text-4xl">Central de operações</h1>
        <p className="mt-3 max-w-xl text-white/70">
          Conteúdos, alunos e atendimento, organizados em um só lugar.
        </p>
      </section>
      <PageHeader
        title="Áreas da plataforma"
        description="Contagens atuais de registros. Escolha uma área para gerenciar."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {areas.filter(Boolean).map((item) => {
          if (!item) return null;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.route}
              className="amf-panel group flex items-start gap-4 transition-colors hover:border-[#0f615f]"
            >
              <span className="rounded-2xl bg-[#f3eee5] p-3 text-[#0f615f]">
                <Icon size={24} />
              </span>
              <div>
                <h2 className="text-lg">{item.label}</h2>
                <p className="mt-1 text-sm text-[#746e65]">
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
