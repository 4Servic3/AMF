import { adminDb, queryError } from "@/lib/admin-data";
import { accessStatus } from "@/lib/admin-values";
import Link from "next/link";
import { describeAccess } from "@/lib/admin-access-target";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
export default async function Access() {
  const db = await adminDb("users.manage");
  const [{ data, error }, courses, products] = await Promise.all([
    db
      .from("entitlements")
      .select("*,profile:profiles!profile_id(full_name,email)")
      .order("created_at", { ascending: false })
      .limit(100),
    db.from("courses").select("id,title"),
    db.from("products").select("id,name"),
  ]);
  [error, courses.error, products.error].forEach(queryError);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quem tem acesso"
        description="Cada linha é um curso ou produto liberado para um aluno, por compra ou liberação manual. Mostra as 100 liberações mais recentes; para liberar ou remover, abra a ficha do aluno."
      />
      <DataTable
        empty={{ title: "Nenhum acesso liberado ainda.", description: "Os acessos aparecem aqui quando um aluno compra ou quando você libera um curso ou produto na ficha dele." }}
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
          {
            header: "Recurso",
            cell: (r) => describeAccess(r, courses.data || [], products.data || []),
          },
          { header: "Status", cell: (r) => accessStatus(r) },
          {
            header: "Expira em",
            cell: (r) =>
              r.expires_at
                ? new Date(r.expires_at).toLocaleDateString("pt-BR")
                : "Sem prazo",
          },
          { header: "Origem", cell: (r) => (r.source_type === "manual" ? "Manual (admin)" : r.source_type === "purchase" ? "Compra" : r.source_type === "subscription" ? "Assinatura" : r.source_type) },
        ]}
      />
    </div>
  );
}
