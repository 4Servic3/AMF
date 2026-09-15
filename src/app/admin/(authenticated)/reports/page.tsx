import { adminDb, allRows, queryError } from "@/lib/admin-data";
import PageHeader from "@/components/admin/ui/PageHeader";
import { MetricsCharts } from "./charts";
export default async function Reports() {
  const db = await adminDb("reports.read");
  const [purchases, profiles] = await Promise.all([
    allRows(db, "purchases", "id,amount_paid,created_at", (q) =>
      q.eq("status", "completed"),
    ),
    allRows(db, "profiles", "id,created_at"),
  ]);
  const revenue = purchases.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const cutoff = new Date();
  cutoff.setUTCDate(1);
  cutoff.setUTCHours(0, 0, 0, 0);
  const data = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(
      Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() - 11 + i, 1),
    );
    const key = d.toISOString().slice(0, 7);
    return {
      name: d.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      revenue: purchases
        .filter((p) => p.created_at.startsWith(key))
        .reduce((s, p) => s + Number(p.amount_paid) / 100, 0),
      users: profiles.filter((p) => p.created_at.startsWith(key)).length,
    };
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Compras concluídas e cadastros registrados. Agrupamento mensal em UTC."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [
            "Receita de compras concluídas",
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(revenue / 100),
          ],
          ["Alunos cadastrados", profiles.length],
          [
            "Cadastros neste mês",
            profiles.filter((p) => Date.parse(p.created_at) >= cutoff.getTime())
              .length,
          ],
        ].map(([label, value]) => (
          <div key={label} className="amf-panel">
            <p className="text-sm text-[#746e65]">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <section className="amf-panel">
        <h2 className="mb-6 text-xl">Últimos 12 meses</h2>
        <MetricsCharts data={data} />
      </section>
    </div>
  );
}
