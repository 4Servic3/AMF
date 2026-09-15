import { adminDb, queryError } from "@/lib/admin-data";
import { createCampaign } from "@/app/admin/actions/communications";
import ActionForm from "@/components/admin/ui/ActionForm";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
export default async function Communications() {
  const db = await adminDb("communications.manage");
  const { data, error } = await db
    .from("notification_campaigns")
    .select("id,name,status,channels,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  queryError(error);
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Comunicações"
        description="Prepare campanhas e mantenha os rascunhos organizados."
      />
      <p className="amf-feedback">
        O envio de campanhas depende da integração do serviço de entrega. Salvar
        um rascunho não envia mensagens aos alunos.
      </p>
      <section className="amf-panel">
        <ActionForm action={createCampaign} label="Salvar rascunho">
          <label className="block">
            Assunto
            <input
              className="mt-2 w-full"
              name="name"
              required
              maxLength={160}
            />
          </label>
          <label className="block">
            Mensagem
            <textarea className="mt-2 w-full" name="body" required rows={5} />
          </label>
          <label className="block">
            Público
            <select className="mt-2 w-full" name="audience">
              <option value="all">Todos os alunos</option>
              <option value="active">Alunos ativos</option>
              <option value="inactive">Alunos inativos</option>
            </select>
          </label>
          <label className="block">
            Canal
            <select className="mt-2 w-full" name="channel">
              <option value="in_app">Aplicativo</option>
              <option value="email">E-mail</option>
            </select>
          </label>
        </ActionForm>
      </section>
      <DataTable
        data={data}
        columns={[
          { header: "Campanha", accessorKey: "name" },
          {
            header: "Situação",
            cell: (r) => (r.status === "draft" ? "Rascunho" : r.status),
          },
          { header: "Canal", cell: (r) => r.channels.join(", ") },
          {
            header: "Criada em",
            cell: (r) => new Date(r.created_at).toLocaleDateString("pt-BR"),
          },
        ]}
      />
    </div>
  );
}
