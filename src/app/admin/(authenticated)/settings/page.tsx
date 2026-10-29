import Link from "next/link";
import { SiteInformationSettings } from "@/components/admin/site-information-settings";
import { logout } from "../../actions/auth";
import { getFeatureFlags } from "@/lib/services/flags";
import { FeatureFlagToggle } from "@/components/admin/feature-flag-toggle";
import PageHeader from "@/components/admin/ui/PageHeader";
import { adminDb, queryError } from "@/lib/admin-data";
import { PLANILHA_PRODUCT_ID } from "@/lib/products/planilha-access";

export const metadata = { title: "Configurações | AMF Admin" };

type Area = { title: string; detail: string; on: boolean; href: string; action: string; flag?: string };

function AreaRow({ area }: { area: Area }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold">
          <span className={`h-2.5 w-2.5 rounded-full ${area.on ? "bg-[#34c759]" : "bg-[var(--admin-border)]"}`} aria-hidden />
          {area.title}
        </p>
        <p className="text-sm text-[var(--admin-secondary)]">{area.detail}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {area.flag && <FeatureFlagToggle hideLabel flagKey={area.flag} description={area.title} enabled={area.on} />}
        <Link href={area.href} className="amf-secondary text-sm">{area.action}</Link>
      </div>
    </li>
  );
}

export default async function SettingsPage() {
  const db = await adminDb("settings.manage");
  const [flags, products, courses, banners] = await Promise.all([
    getFeatureFlags(),
    db.from("products").select("id,name,status,checkout_url").neq("status", "draft"),
    db.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("home_banners").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  [products.error, courses.error, banners.error].forEach(queryError);
  const productRows = (products.data || []) as { id: string; name: string; status: string; checkout_url: string | null }[];
  const planilha = productRows.find((p) => p.id === PLANILHA_PRODUCT_ID);
  const onSale = productRows.filter((p) => p.status === "active");
  const withCheckout = onSale.filter((p) => p.checkout_url).length;

  const areas: Area[] = [
    { title: "Cursos", detail: `${courses.count || 0} publicados. Cada curso é ligado ou desligado no próprio editor.`, on: (courses.count || 0) > 0, href: "/admin/courses", action: "Abrir cursos" },
    { title: "Planilha de doses seguras", detail: planilha?.status === "active" ? "À venda e liberada para quem comprou." : "Pausada: alunos não conseguem comprar.", on: planilha?.status === "active", href: "/admin/products", action: "Abrir produto" },
    { title: "Casos clínicos e stories", detail: "Stories na home e arquivo de casos do aluno.", on: flags.member_cases_enabled, href: "/admin/cases", action: "Abrir casos", flag: "member_cases_enabled" },
    { title: "Academia", detail: "Trilha flutuante de estudos dentro do app.", on: flags.member_academy_enabled, href: "/admin/courses", action: "Ver cursos", flag: "member_academy_enabled" },
    { title: "Banners da home", detail: banners.count ? `${banners.count} no ar.` : "Nenhum no ar: aparece a imagem padrão.", on: (banners.count || 0) > 0, href: "/admin/home", action: "Abrir banners" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Configurações"
        description="Veja o que está ligado no aplicativo, como estão as vendas e as informações institucionais."
      />

      <section className="amf-panel" aria-labelledby="areas">
        <h2 id="areas" className="text-[17px]">Áreas do aplicativo</h2>
        <p className="mt-1 text-sm text-[var(--admin-secondary)]">Ponto verde: o aluno está vendo. Os botões Ativado e Desativado ligam ou desligam a área para todos.</p>
        <ul className="mt-2 divide-y divide-[var(--admin-separator)]">
          {areas.map((area) => <AreaRow key={area.title} area={area} />)}
        </ul>
      </section>

      <section className="amf-panel" aria-labelledby="vendas">
        <h2 id="vendas" className="text-[17px]">Vendas</h2>
        <ul className="mt-2 divide-y divide-[var(--admin-separator)]">
          <AreaRow area={{ title: "Links de pagamento", detail: `${withCheckout} de ${onSale.length} produtos à venda já têm link de checkout.`, on: onSale.length > 0 && withCheckout === onSale.length, href: "/admin/products", action: "Configurar links" }} />
          <AreaRow area={{ title: "Provedor de pagamento", detail: "Ainda não conectado. Quando estiver, compras e assinaturas liberam o acesso sozinhas.", on: false, href: "/admin/subscriptions", action: "Ver assinaturas" }} />
        </ul>
      </section>

      <SiteInformationSettings />

      <section className="amf-panel" aria-labelledby="sessao">
        <h2 id="sessao" className="text-[17px]">Sessão administrativa</h2>
        <p className="mt-1 mb-4 text-sm text-[var(--admin-secondary)]">Encerre sua sessão neste navegador com segurança. Segurança, auditoria e monitoramento estão nas abas acima.</p>
        <form action={logout}>
          <button type="submit" className="amf-secondary !text-[var(--admin-danger)]">Sair da minha conta</button>
        </form>
      </section>
    </div>
  );
}
