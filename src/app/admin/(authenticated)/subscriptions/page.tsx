import { adminDb, queryError } from "@/lib/admin-data";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
export default async function Subscriptions() {
  const db = await adminDb("users.manage");
  const { data, error } = await db
    .from("subscriptions")
    .select("*,profile:profiles!profile_id(full_name),product:products(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  queryError(error);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        description="100 assinaturas mais recentes registradas pelo sistema de pagamentos. Acessos manuais ficam em Acessos."
      />
      <DataTable
        data={data || []}
        columns={[
          {
            header: "Aluno",
            cell: (r) => (
              <Link className="underline" href={"/admin/users/" + r.profile_id}>
                {r.profile?.full_name || r.profile_id}
              </Link>
            ),
          },
          { header: "Produto", cell: (r) => r.product?.name || "—" },
          { header: "Status", accessorKey: "status" },
          {
            header: "Fim do período",
            cell: (r) =>
              new Date(r.current_period_end).toLocaleDateString("pt-BR"),
          },
          {
            header: "Renovação",
            cell: (r) =>
              r.cancel_at_period_end
                ? "Cancelamento ao fim do período"
                : "Conforme provedor",
          },
        ]}
      />
    </div>
  );
}
