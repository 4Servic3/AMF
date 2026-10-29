import { adminDb, queryError } from "@/lib/admin-data";
import { accessStatus } from "@/lib/admin-values";
import Link from "next/link";
import { describeAccess, encodeAccessTarget } from "@/lib/admin-access-target";
import { accessCounts, filterAccess, ORIGIN_LABEL, SITUATION_OPTIONS, type AccessRow } from "@/lib/admin/access-filters";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";

type Row = AccessRow & { id: string; profile_id: string };
type Filters = { q?: string; recurso?: string; situacao?: string; origem?: string };

// Hora do pedido: o status de cada acesso depende do relógio do servidor.
const requestTime = () => Date.now();
const LIMIT = 500;

export default async function Access({ searchParams }: { searchParams: Promise<Filters> }) {
  const db = await adminDb("users.manage");
  const filters = await searchParams;
  const [{ data, error }, courses, products] = await Promise.all([
    db
      .from("entitlements")
      .select("id,profile_id,resource_type,resource_id,source_type,status,starts_at,expires_at,profile:profiles!profile_id(full_name,email)")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    db.from("courses").select("id,title").order("title"),
    db.from("products").select("id,name,type").order("sort_order").order("name"),
  ]);
  [error, courses.error, products.error].forEach(queryError);
  const now = requestTime();
  const all = (data || []) as unknown as Row[];
  const rows = filterAccess(all, filters, now);
  const counts = accessCounts(all, now);
  const filtered = Boolean(filters.q || filters.recurso || filters.situacao || filters.origem);
  const cards = [
    { label: "Acessos ativos", value: counts.active, hint: "cursos e produtos liberados agora" },
    { label: "Vencem em 30 dias", value: counts.soon, hint: "prazo terminando em breve" },
    { label: "Por compra ou assinatura", value: counts.paid, hint: "liberados pelo pagamento" },
    { label: "Liberados pelo admin", value: counts.manual, hint: "cortesias e testes" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quem tem acesso"
        description="Cada linha é um curso ou produto liberado para um aluno, por compra ou liberação manual. Para liberar ou remover, abra a ficha do aluno."
        actions={<Link className="amf-primary" href="/admin/users/new">Criar usuário</Link>}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo dos acessos">
        {cards.map((card) => (
          <div key={card.label} className="amf-panel">
            <p className="text-[13px] font-medium text-[var(--admin-secondary)]">{card.label}</p>
            <p className="mt-1 text-[32px] font-bold tabular-nums leading-tight">{card.value}</p>
            <p className="mt-1 text-[12.5px] text-[var(--admin-tertiary)]">{card.hint}</p>
          </div>
        ))}
      </section>
      <form method="get" className="amf-panel grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto]" aria-label="Filtrar acessos">
        <label className="block text-sm font-medium">Aluno<input name="q" defaultValue={filters.q || ""} placeholder="Nome ou e-mail" className="mt-1 w-full" /></label>
        <label className="block text-sm font-medium">Conteúdo
          <select name="recurso" defaultValue={filters.recurso || ""} className="mt-1 w-full">
            <option value="">Todos</option>
            <optgroup label="Cursos">{(courses.data || []).map((c: { id: string; title: string }) => <option key={c.id} value={encodeAccessTarget({ kind: "course", id: c.id })}>{c.title}</option>)}</optgroup>
            <optgroup label="Produtos">{(products.data || []).filter((p: { type: string }) => p.type !== "course").map((p: { id: string; name: string }) => <option key={p.id} value={encodeAccessTarget({ kind: "product", id: p.id })}>{p.name}</option>)}</optgroup>
          </select>
        </label>
        <label className="block text-sm font-medium">Situação
          <select name="situacao" defaultValue={filters.situacao || ""} className="mt-1 w-full"><option value="">Todas</option>{SITUATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        </label>
        <label className="block text-sm font-medium">Origem
          <select name="origem" defaultValue={filters.origem || ""} className="mt-1 w-full"><option value="">Todas</option>{Object.entries(ORIGIN_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <div className="flex items-end gap-2">
          <button className="amf-primary">Filtrar</button>
          {filtered && <Link className="amf-secondary" href="/admin/access">Limpar</Link>}
        </div>
      </form>
      <p className="text-sm text-[var(--admin-secondary)]">
        {rows.length} {rows.length === 1 ? "acesso" : "acessos"}{filtered ? " com estes filtros" : ""}
        {all.length === LIMIT && ` · considerando as ${LIMIT} liberações mais recentes`}
      </p>
      <DataTable
        empty={filtered
          ? { title: "Nenhum acesso com estes filtros.", description: "Troque os filtros ou limpe a busca para ver todos." }
          : { title: "Nenhum acesso liberado ainda.", description: "Os acessos aparecem aqui quando um aluno compra ou quando você libera um curso ou produto na ficha dele." }}
        data={rows}
        columns={[
          {
            header: "Aluno",
            cell: (r) => (
              <Link className="font-medium hover:underline" href={"/admin/users/" + r.profile_id}>
                {r.profile?.full_name || r.profile?.email || r.profile_id}
                {r.profile?.full_name && r.profile?.email && <span className="block text-xs font-normal text-[var(--admin-secondary)]">{r.profile.email}</span>}
              </Link>
            ),
          },
          { header: "Conteúdo", cell: (r) => describeAccess(r, courses.data || [], products.data || []) },
          { header: "Situação", cell: (r) => accessStatus(r, now) },
          {
            header: "Válido até",
            cell: (r) => (r.expires_at ? new Date(r.expires_at).toLocaleDateString("pt-BR") : "Sem prazo"),
          },
          { header: "Origem", cell: (r) => ORIGIN_LABEL[r.source_type || ""] || r.source_type || "—" },
        ]}
      />
    </div>
  );
}
