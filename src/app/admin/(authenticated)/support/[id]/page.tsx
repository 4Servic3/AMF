import { adminDb, queryError } from "@/lib/admin-data";
import { notFound } from "next/navigation";
import { replyToTicket, setTicketStatus } from "@/app/admin/actions/support";
import ActionForm from "@/components/admin/ui/ActionForm";
import PageHeader from "@/components/admin/ui/PageHeader";
export default async function Ticket({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = await adminDb("support.manage"),
    { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: ticket, error } = await db
    .from("support_tickets")
    .select("*,support_messages(*)")
    .eq("id", id)
    .maybeSingle();
  queryError(error);
  if (!ticket) notFound();
  const messages = ticket.support_messages.sort((a: any, b: any) =>
    a.created_at.localeCompare(b.created_at),
  );
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={ticket.subject}
        description={"Atendimento " + id.slice(0, 8)}
      />
      <section className="amf-panel">
        <ActionForm
          action={async (form) => {
            "use server";
            await setTicketStatus(id, String(form.get("status")));
          }}
          label="Atualizar situação"
        >
          <label>
            Situação
            <select className="ml-3" name="status" defaultValue={ticket.status}>
              {[
                ["open", "Aberto"],
                ["pending", "Pendente"],
                ["resolved", "Resolvido"],
                ["closed", "Fechado"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      </section>
      {messages.map((m: any) => (
        <article className="amf-panel" key={m.id}>
          <p className="text-xs text-[#746e65]">
            {m.is_internal ? "Nota interna" : "Mensagem"} ·{" "}
            {new Date(m.created_at).toLocaleString("pt-BR")}
          </p>
          <p className="mt-3 whitespace-pre-wrap">{m.content}</p>
        </article>
      ))}
      <section className="amf-panel">
        <h2 className="mb-4 text-xl">Responder</h2>
        <ActionForm
          action={async (form) => {
            "use server";
            await replyToTicket(
              id,
              String(form.get("content")),
              form.get("internal") === "on",
            );
          }}
          label="Enviar resposta"
        >
          <label className="block">
            Mensagem
            <textarea
              name="content"
              className="mt-2 w-full"
              required
              maxLength={10000}
              rows={5}
            />
          </label>
          <label className="flex gap-2">
            <input type="checkbox" name="internal" />
            Nota interna (visível somente no admin)
          </label>
        </ActionForm>
      </section>
    </div>
  );
}
