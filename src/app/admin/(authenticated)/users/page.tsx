import { adminDb, queryError } from "@/lib/admin-data";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
export default async function Users({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const db = await adminDb("users.manage"),
    params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  let query = db
    .from("profiles")
    .select("id,full_name,email,created_at", { count: "exact" });
  if (params.q)
    query = query.ilike("full_name", "%" + params.q.replace(/[%_]/g, "") + "%");
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 50, page * 50 - 1);
  queryError(error);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alunos"
        description="Perfis, acessos e histórico de aprendizagem."
      />
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={params.q}
          aria-label="Buscar aluno pelo nome"
          placeholder="Nome do aluno"
        />
        <button className="amf-secondary">Buscar</button>
      </form>
      <DataTable
        data={data || []}
        columns={[
          { header: "Nome", accessorKey: "full_name" },
          { header: "E-mail", accessorKey: "email" },
          {
            header: "Cadastro",
            cell: (row) => new Date(row.created_at).toLocaleDateString("pt-BR"),
          },
          {
            header: "Perfil",
            cell: (row) => (
              <Link
                className="text-[#0f615f] underline"
                href={"/admin/users/" + row.id}
              >
                Gerenciar
              </Link>
            ),
          },
        ]}
      />
      <div className="flex items-center gap-4">
        <p className="text-sm">
          {count} alunos · Página {page}
        </p>
        {page > 1 && (
          <Link
            className="amf-secondary"
            href={
              "?page=" + (page - 1) + "&q=" + encodeURIComponent(params.q || "")
            }
          >
            Anterior
          </Link>
        )}
        {page * 50 < count && (
          <Link
            className="amf-secondary"
            href={
              "?page=" + (page + 1) + "&q=" + encodeURIComponent(params.q || "")
            }
          >
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
