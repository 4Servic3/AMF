import { adminDb, queryError } from "@/lib/admin-data";
import { notFound, redirect } from "next/navigation";
import {
  saveAcademyPath,
  savePhase,
  saveStep,
} from "@/app/admin/actions/academy";
import ActionForm from "@/components/admin/ui/ActionForm";
import PageHeader from "@/components/admin/ui/PageHeader";
export default async function AcademyEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = await adminDb("academy.manage"),
    { id } = await params;
  let item: any = {
    title: "",
    slug: "",
    description: "",
    status: "draft",
    estimated_weeks: 4,
    phases: [],
  };
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data, error } = await db
      .from("academy_paths")
      .select("*,phases:academy_phases(*,steps:academy_steps(*))")
      .eq("id", id)
      .maybeSingle();
    queryError(error);
    if (!data) notFound();
    item = data;
  }
  const [courses, cases] = await Promise.all([
    db.from("courses").select("id,title"),
    db.from("cases").select("id,title"),
  ]);
  [courses, cases].forEach((r) => queryError(r.error));
  const targets = [
    ...courses.data.map((c: any) => ({ ...c, type: "course" })),
    ...cases.data.map((c: any) => ({ ...c, type: "case" })),
  ];
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={id === "new" ? "Nova trilha" : item.title}
        description="Organize fases e conteúdos na ordem de aprendizagem."
      />
      <section className="amf-panel">
        <ActionForm
          action={async (form) => {
            "use server";
            const result = await saveAcademyPath(id, Object.fromEntries(form));
            if (id === "new") redirect("/admin/academy/editor/" + result.id);
          }}
        >
          <label className="block">
            Título
            <input
              className="mt-2 w-full"
              name="title"
              defaultValue={item.title}
              required
            />
          </label>
          <label className="block">
            Endereço curto
            <input
              className="mt-2 w-full"
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={item.slug}
              required
            />
          </label>
          <label className="block">
            Descrição
            <textarea
              className="mt-2 w-full"
              name="description"
              defaultValue={item.description}
            />
          </label>
          <label className="block">
            Semanas estimadas
            <input
              className="ml-3"
              name="estimated_weeks"
              type="number"
              min="1"
              max="104"
              defaultValue={item.estimated_weeks}
            />
          </label>
          <select
            aria-label="Status da trilha"
            name="status"
            defaultValue={item.status}
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </ActionForm>
      </section>
      {id !== "new" && (
        <>
          <section className="amf-panel">
            <h2 className="mb-4 text-xl">Adicionar fase</h2>
            <ActionForm
              action={async (form) => {
                "use server";
                await savePhase(null, {
                  ...Object.fromEntries(form),
                  path_id: id,
                });
              }}
              label="Criar fase"
            >
              <label className="block">
                Título
                <input className="mt-2 w-full" name="title" required />
              </label>
              <label>
                Posição
                <input
                  className="ml-3"
                  name="position"
                  type="number"
                  min="0"
                  defaultValue={item.phases.length}
                />
              </label>
            </ActionForm>
          </section>
          {item.phases
            .sort((a: any, b: any) => a.position - b.position)
            .map((phase: any) => (
              <section key={phase.id} className="amf-panel space-y-6">
                <ActionForm
                  action={async (form) => {
                    "use server";
                    await savePhase(phase.id, {
                      ...Object.fromEntries(form),
                      path_id: id,
                    });
                  }}
                  label="Salvar fase"
                >
                  <label className="block">
                    Fase
                    <input
                      className="mt-2 w-full"
                      name="title"
                      required
                      defaultValue={phase.title}
                    />
                  </label>
                  <label>
                    Posição
                    <input
                      className="ml-3"
                      name="position"
                      type="number"
                      min="0"
                      defaultValue={phase.position}
                    />
                  </label>
                </ActionForm>
                {[
                  ...phase.steps.sort(
                    (a: any, b: any) => a.position - b.position,
                  ),
                  {
                    id: null,
                    position: phase.steps.length,
                    status: "published",
                  },
                ].map((step: any, i: number) => (
                  <div className="border-t pt-5" key={step.id || "new"}>
                    <h3 className="mb-3">
                      {step.id ? "Etapa " + (i + 1) : "Adicionar etapa"}
                    </h3>
                    <ActionForm
                      action={async (form) => {
                        "use server";
                        const target = String(form.get("target")).split(":");
                        await saveStep(step.id, {
                          phase_id: phase.id,
                          target_id: target[1],
                          step_type: target[0],
                          position: form.get("position"),
                          title_override: String(form.get("title_override")),
                          status: String(form.get("status")),
                        });
                      }}
                      label={step.id ? "Salvar etapa" : "Adicionar etapa"}
                    >
                      <label className="block">
                        Conteúdo
                        <select
                          required
                          name="target"
                          className="mt-2 w-full"
                          defaultValue={
                            step.target_id
                              ? step.step_type + ":" + step.target_id
                              : ""
                          }
                        >
                          <option value="">Selecione curso ou caso</option>
                          {targets.map((t) => (
                            <option
                              key={t.type + t.id}
                              value={t.type + ":" + t.id}
                            >
                              {t.type === "course" ? "Curso" : "Caso"} ·{" "}
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        Título alternativo
                        <input
                          name="title_override"
                          className="mt-2 w-full"
                          defaultValue={step.title_override || ""}
                        />
                      </label>
                      <label>
                        Posição
                        <input
                          className="ml-3"
                          name="position"
                          type="number"
                          min="0"
                          defaultValue={step.position}
                        />
                      </label>
                      <select
                        name="status"
                        aria-label="Status da etapa"
                        defaultValue={step.status}
                      >
                        <option value="published">Disponível</option>
                        <option value="archived">Arquivada</option>
                      </select>
                    </ActionForm>
                  </div>
                ))}
              </section>
            ))}
        </>
      )}
    </div>
  );
}
