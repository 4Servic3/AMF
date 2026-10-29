import { adminDb, queryError } from "@/lib/admin-data";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import { dueLabel, SUBSCRIPTION_STATUS, subscriptionCounts } from "@/lib/admin/subscription-due";

// Hora do pedido: o vencimento é contado a partir do relógio do servidor.
const requestTime = () => Date.now();

export default async function Subscriptions() {
  const db = await adminDb("users.manage");
  const { data, error } = await db
    .from("subscriptions")
    .select("*,profile:profiles!profile_id(full_name,email),product:products(name)")
    .order("current_period_end", { ascending: true })
    .limit(200);
  queryError(error);
  const now = requestTime();
  const rows = data || [];
  const counts = subscriptionCounts(rows, now);
  const cards = [
    { label: "Assinaturas ativas", value: counts.active, hint: "pagando ou em teste" },
    { label: "Vencem em 7 dias", value: counts.dueSoon, hint: "próximas cobranças" },
    { label: "Pagamento atrasado", value: counts.late, hint: "precisam de atenção" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        description="Assinaturas registradas pelo provedor de pagamento, ordenadas pelo próximo vencimento. Acessos dados à mão ficam em Quem tem acesso."
      />
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo das assinaturas">
        {cards.map((card) => (
          <div key={card.label} className="amf-panel">
            <p className="text-[13px] font-medium text-[var(--admin-secondary)]">{card.label}</p>
            <p className="mt-1 text-[32px] font-bold tabular-nums leading-tight">{card.value}</p>
            <p className="mt-1 text-[12.5px] text-[var(--admin-tertiary)]">{card.hint}</p>
          </div>
        ))}
      </section>
      {!rows.length && (
        <p className="amf-feedback">
          O provedor de pagamento ainda não está conectado. Quando estiver, cada pagamento cria ou renova a assinatura aqui, com a data de vencimento.
        </p>
      )}
      <DataTable
        empty={{ title: "Nenhuma assinatura ainda.", description: "As assinaturas do produto Casos Clínicos vão aparecer aqui com o vencimento quando o provedor de pagamento for conectado." }}
        data={rows}
        columns={[
          {
            header: "Aluno",
            cell: (r) => (
              <Link className="font-medium hover:underline" href={"/admin/users/" + r.profile_id}>
                {r.profile?.full_name || r.profile?.email || r.profile_id}
              </Link>
            ),
          },
          { header: "Produto", cell: (r) => r.product?.name || "—" },
          { header: "Situação", cell: (r) => SUBSCRIPTION_STATUS[r.status] || r.status },
          {
            header: "Vencimento",
            cell: (r) => (
              <span>
                {new Date(r.current_period_end).toLocaleDateString("pt-BR")}
                <span className="block text-xs text-[var(--admin-secondary)]">{dueLabel(r.current_period_end, now)}</span>
              </span>
            ),
          },
          {
            header: "Renovação",
            cell: (r) => (r.cancel_at_period_end ? "Encerra no vencimento" : "Renova automaticamente"),
          },
        ]}
      />
    </div>
  );
}
