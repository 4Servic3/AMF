import { adminDb, queryError } from "@/lib/admin-data";
import { accessStatus } from "@/lib/admin-values";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
export default async function Access() {
  const db = await adminDb("users.manage");
  const { data, error } = await db
    .from("entitlements")
    .select("*,profile:profiles!profile_id(full_name,email)")
    .order("created_at", { ascending: false })
    .limit(100);
  queryError(error);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Acessos"
        description="100 concessões mais recentes. Abra o perfil do aluno para gerenciar."
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
          {
            header: "Recurso",
            cell: (r) => r.resource_type + " · " + r.resource_id,
          },
          { header: "Status", cell: (r) => accessStatus(r) },
          {
            header: "Expira em",
            cell: (r) =>
              r.expires_at
                ? new Date(r.expires_at).toLocaleDateString("pt-BR")
                : "Sem prazo",
          },
          { header: "Origem", accessorKey: "source_type" },
        ]}
      />
    </div>
  );
}
