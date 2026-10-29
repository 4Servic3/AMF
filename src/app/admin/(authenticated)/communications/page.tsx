import { adminDb, queryError } from "@/lib/admin-data";
import { publishInAppNotice } from "@/app/admin/actions/communications";
import StatusBadge from "@/components/admin/ui/StatusBadge";
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
        title="Notificações"
        description="Publique avisos que aparecem na área de notificações de todos os alunos."
      />
      <section className="amf-panel">
        <ActionForm
          action={publishInAppNotice}
          label="Publicar no aplicativo"
          confirmMessage="Publicar este aviso para todos os alunos agora?"
        >
          <label className="block">
            Título
            <input className="mt-2 w-full" name="name" required maxLength={160} />
          </label>
          <label className="block">
            Mensagem
            <textarea className="mt-2 w-full" name="body" required rows={5} maxLength={2000} />
          </label>
          <label className="block">
            Link no app (opcional)
            <input className="mt-2 w-full" name="target_url" placeholder="/app/cursos" pattern="/app.*" />
          </label>
        </ActionForm>
      </section>
      <p className="text-sm text-[var(--admin-secondary)]">
        Envio por e-mail ainda não está disponível: depende de um serviço de e-mail configurado.
      </p>
      <DataTable
        data={data}
        columns={[
          { header: "Campanha", accessorKey: "name" },
          {
            header: "Situação",
            cell: (r) => (
              <StatusBadge variant={r.status === "completed" ? "success" : r.status === "failed" ? "error" : "neutral"}>
                {r.status === "completed" ? "Publicada" : r.status === "failed" ? "Falhou" : r.status === "draft" ? "Rascunho" : r.status}
              </StatusBadge>
            ),
          },
          { header: "Canal", cell: (r) => r.channels.map((c: string) => (c === "in_app" ? "Aplicativo" : c === "email" ? "E-mail" : c)).join(", ") },
          {
            header: "Criada em",
            cell: (r) => new Date(r.created_at).toLocaleDateString("pt-BR"),
          },
        ]}
      />
    </div>
  );
}
