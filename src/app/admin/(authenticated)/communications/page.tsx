import { adminDb, queryError } from "@/lib/admin-data";
import { publishInAppNotice } from "@/app/admin/actions/communications";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import ActionForm from "@/components/admin/ui/ActionForm";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
export default async function Communications() {
  const db = await adminDb("communications.manage");
  const [{ data, error }, live] = await Promise.all([
    db
      .from("notification_campaigns")
      .select("id,name,status,channels,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    // O que o aluno vê agora no sino: a mesma tabela que a tela do aluno lê.
    db.from("notifications").select("id,title,message,created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  queryError(error);
  queryError(live.error);
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
      <section className="amf-panel">
        <h2 className="text-[17px]">No aplicativo agora</h2>
        <p className="mt-1 text-sm text-[var(--admin-secondary)]">
          Os últimos avisos que os alunos veem no sino e em Notificações.
        </p>
        {live.data?.length ? (
          <ul className="mt-4 divide-y divide-[var(--admin-separator)]">
            {live.data.map((n: { id: string; title: string; message: string; created_at: string }) => (
              <li key={n.id} className="py-3">
                <p className="font-semibold">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-[var(--admin-secondary)]">{n.message}</p>
                <p className="mt-1 text-xs text-[var(--admin-tertiary)]">
                  {new Date(n.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--admin-secondary)]">Nenhum aviso visível para os alunos ainda.</p>
        )}
      </section>
      <p className="text-sm text-[var(--admin-secondary)]">
        Envio por e-mail ainda não está disponível: depende de um serviço de e-mail configurado.
      </p>
      <DataTable
        empty={{ title: "Nenhum aviso publicado ainda.", description: "Escreva um título e uma mensagem acima e publique. O aviso aparece no sino e na tela de notificações de todos os alunos." }}
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
