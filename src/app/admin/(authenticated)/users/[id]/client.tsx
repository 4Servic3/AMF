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
import { describeAccess, encodeAccessTarget } from "@/lib/admin-access-target";
import ActionForm from "@/components/admin/ui/ActionForm";
import DataTable from "@/components/admin/ui/DataTable";
import type { StudentCourse } from "@/lib/admin/student-courses";

const LESSON_STATE = {
  concluida: { label: "Concluída", className: "bg-[#e8f6ee] text-[#1f7a4d]" },
  andamento: { label: "Em andamento", className: "bg-[var(--admin-tint-soft)] text-[var(--admin-tint)]" },
  pendente: { label: "Não iniciada", className: "bg-[var(--admin-fill)] text-[var(--admin-secondary)]" },
} as const;
export default function UserCrmClient({
  user,
  entitlements,
  notes,
  progress,
  courses,
  products,
  learning,
}: {
  user: any;
  entitlements: any[];
  notes: any[];
  progress: any[];
  courses: any[];
  products: any[];
  learning: StudentCourse[];
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
        {learning.length > 0 && (
          <p className="mt-1 text-sm text-[var(--admin-secondary)]">
            {learning.map((c) => `${c.title}: ${c.percent}%`).join(" · ")}
          </p>
        )}
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
                cell: (e) => describeAccess(e, courses, products),
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
            <h2 className="mb-4 text-xl">Conceder acesso</h2>
            <ActionForm
              action={async (form) => {
                await grantManualAccess(
                  user.id,
                  String(form.get("target")),
                  String(form.get("reason")),
                );
              }}
              label="Conceder acesso"
            >
              <label className="block">
                Conteúdo
                <select className="mt-2 w-full" name="target" required>
                  <option value="">Selecione</option>
                  <optgroup label="Cursos publicados">
                    {courses.filter((c) => c.status === "published").map((c) => (
                      <option key={c.id} value={encodeAccessTarget({ kind: "course", id: c.id })}>
                        {c.title}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Produtos">
                    {products.filter((p) => p.status === "active" && p.type !== "course").map((p) => (
                      <option key={p.id} value={encodeAccessTarget({ kind: "product", id: p.id })}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
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
        <div className="space-y-4">
          {!learning.length && (
            <section className="amf-panel text-center">
              <p className="font-semibold">Nenhum curso liberado ou iniciado.</p>
              <p className="mt-1 text-sm text-[var(--admin-secondary)]">Libere um curso na aba Acessos para acompanhar o progresso aqui.</p>
            </section>
          )}
          {learning.map((course) => (
            <section key={course.id} className="amf-panel">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg">{course.title}</h2>
                  <p className="text-sm text-[var(--admin-secondary)]">
                    {course.completed} de {course.total} aulas concluídas
                    {course.lastActivity && <> · última atividade em {new Date(course.lastActivity).toLocaleDateString("pt-BR")}</>}
                    {!course.hasAccess && " · sem acesso ativo"}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:w-56">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--admin-fill)]">
                    <div className="h-full rounded-full bg-[var(--admin-tint)]" style={{ width: `${course.percent}%` }} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{course.percent}%</span>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {course.modules.map((mod) => (
                  <div key={mod.id}>
                    <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-[.06em] text-[var(--admin-tertiary)]">{mod.title}</h3>
                    <ul className="divide-y divide-[var(--admin-separator)]">
                      {mod.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span className="min-w-0 truncate">{lesson.title}</span>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${LESSON_STATE[lesson.state].className}`}>
                            {lesson.state === "andamento" && lesson.percent > 0 ? `${lesson.percent}%` : LESSON_STATE[lesson.state].label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
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
