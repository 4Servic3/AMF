"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addInternalNote,
  grantManualAccess,
  revokeAccess,
  suspendUser,
  restoreUser,
  handleDataRequest,
} from "@/app/admin/actions/users";
import { accessStatus } from "@/lib/admin-values";
import ActionForm from "@/components/admin/ui/ActionForm";
import DataTable from "@/components/admin/ui/DataTable";
export default function UserCrmClient({
  user,
  entitlements,
  notes,
  progress,
  courses,
}: {
  user: any;
  entitlements: any[];
  notes: any[];
  progress: any[];
  courses: any[];
}) {
  const [tab, setTab] = useState("Perfil"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
      router.refresh();
      setMessage("Operação concluída.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na operação.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">{user.full_name}</h1>
        <p className="mt-2">
          {user.email} · {user.suspended ? "Suspenso" : "Ativo"}
        </p>
      </header>
      <nav className="flex gap-2 overflow-x-auto" aria-label="Seções do aluno">
        {[
          "Perfil",
          "Acessos",
          "Aprendizado",
          "Notas internas",
          "Privacidade",
        ].map((name) => (
          <button
            className={tab === name ? "amf-primary" : "amf-secondary"}
            key={name}
            onClick={() => setTab(name)}
            aria-pressed={tab === name}
          >
            {name}
          </button>
        ))}
      </nav>
      {message && (
        <p role="status" className="amf-feedback">
          {message}
        </p>
      )}
      {tab === "Perfil" && (
        <section className="amf-panel space-y-4">
          <h2 className="text-xl">Dados da conta</h2>
          <p>
            Cadastrado em{" "}
            {new Date(user.created_at).toLocaleDateString("pt-BR")}
          </p>
          <p className="break-all text-sm">ID: {user.id}</p>
          <button
            disabled={busy}
            className="amf-secondary"
            onClick={() => {
              if (
                confirm(
                  user.suspended
                    ? "Reativar esta conta?"
                    : "Suspender o acesso desta conta?",
                )
              )
                void run(() =>
                  user.suspended
                    ? restoreUser(user.id)
                    : suspendUser(
                        user.id,
                        "Suspensão manual pelo administrador",
                      ),
                );
            }}
          >
            {user.suspended ? "Reativar conta" : "Suspender conta"}
          </button>
        </section>
      )}
      {tab === "Acessos" && (
        <>
          <DataTable
            data={entitlements}
            columns={[
              {
                header: "Conteúdo",
                cell: (e) =>
                  courses.find((c) => c.id === e.resource_id)?.title ||
                  e.resource_type + " · " + e.resource_id,
              },
              { header: "Situação", cell: (e) => accessStatus(e) },
              {
                header: "Ação",
                cell: (e) =>
                  e.status === "active" ? (
                    <button
                      disabled={busy}
                      className="text-red-700"
                      onClick={() => {
                        if (confirm("Revogar este acesso?"))
                          void run(() =>
                            revokeAccess(user.id, e.id, "Revogação manual"),
                          );
                      }}
                    >
                      Revogar
                    </button>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
          <section className="amf-panel">
            <h2 className="mb-4 text-xl">Conceder acesso a curso</h2>
            <ActionForm
              action={async (form) => {
                await grantManualAccess(
                  user.id,
                  String(form.get("course")),
                  String(form.get("reason")),
                );
              }}
              label="Conceder acesso"
            >
              <label className="block">
                Curso
                <select className="mt-2 w-full" name="course" required>
                  <option value="">Selecione</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Motivo
                <input
                  className="mt-2 w-full"
                  name="reason"
                  minLength={3}
                  required
                />
              </label>
            </ActionForm>
          </section>
        </>
      )}
      {tab === "Aprendizado" && (
        <DataTable
          data={progress}
          columns={[
            {
              header: "Aula",
              cell: (p) => p.lesson?.title || "Aula indisponível",
            },
            {
              header: "Progresso",
              cell: (p) =>
                p.is_completed ? "Concluída" : (p.progress_percent || 0) + "%",
            },
          ]}
        />
      )}{" "}
      {tab === "Notas internas" && (
        <section className="amf-panel space-y-6">
          <ActionForm
            action={async (form) => {
              await addInternalNote(user.id, String(form.get("note")));
            }}
            label="Salvar nota"
          >
            <label className="block">
              Nota interna
              <textarea
                className="mt-2 w-full"
                name="note"
                required
                maxLength={5000}
              />
            </label>
          </ActionForm>
          {notes.map((n) => (
            <article key={n.id} className="border-t py-4">
              <p className="text-xs">
                {new Date(n.created_at).toLocaleString("pt-BR")}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{n.content}</p>
            </article>
          ))}
        </section>
      )}
      {tab === "Privacidade" && (
        <section className="amf-panel space-y-4">
          <h2 className="text-xl">Dados do aluno</h2>
          <p>
            A exportação contém perfil, acessos e progresso. Solicitações de
            exclusão ficam registradas para tratamento completo da conta.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              className="amf-secondary"
              onClick={() =>
                void run(async () => {
                  const data = await handleDataRequest(user.id, "export");
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(data, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "dados-aluno-" + user.id + ".json";
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                })
              }
            >
              Exportar dados
            </button>
            <button
              disabled={busy}
              className="amf-secondary"
              onClick={() => {
                if (confirm("Registrar solicitação de exclusão desta conta?"))
                  void run(() => handleDataRequest(user.id, "anonymize"));
              }}
            >
              Solicitar exclusão
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
