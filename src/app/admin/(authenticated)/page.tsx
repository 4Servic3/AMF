import Link from "next/link";
import { BellPlus, BookOpen, Clapperboard, LifeBuoy, UserPlus } from "lucide-react";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { allRows, queryError } from "@/lib/admin-data";
import {
  courseFunnel,
  progressKpis,
  STALLED_DAYS,
  stuckLessons,
  summarizeStudents,
  weeklyActivity,
  type ProgressProfile,
  type StudentState,
} from "@/lib/admin/student-progress";

export const metadata = { title: "Painel | AMF Admin" };

const STATES: { key: StudentState | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "nunca", label: "Nunca começaram" },
  { key: "parado", label: `Parados há ${STALLED_DAYS}+ dias` },
  { key: "ativo", label: "Em andamento" },
  { key: "concluiu", label: "Concluíram" },
];
const STATE_STYLE: Record<StudentState, string> = {
  nunca: "bg-[#fff4e5] text-[#9a5b00]",
  parado: "bg-[#ffecee] text-[#b4232f]",
  ativo: "bg-[var(--admin-tint-soft)] text-[var(--admin-tint)]",
  concluiu: "bg-[#e8f6ee] text-[#1f7a4d]",
};
const STATE_LABEL: Record<StudentState, string> = { nunca: "Nunca começou", parado: "Parado", ativo: "Em andamento", concluiu: "Concluiu" };
const PAGE_SIZE = 50;
/** Hora da requisição: o painel é renderizado a cada acesso, nunca em cache. */
const requestTime = () => Date.now();

const dateBR = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";

async function profilesFor(db: ReturnType<typeof createServiceRoleClient>, ids: string[], all: boolean) {
  const columns = "id,full_name,email,created_at";
  if (all) return (await allRows(db, "profiles", columns)) as ProgressProfile[];
  const rows: ProgressProfile[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await db.from("profiles").select(columns).in("id", ids.slice(i, i + 100));
    queryError(error);
    rows.push(...((data || []) as ProgressProfile[]));
  }
  return rows;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string; filtro?: string; q?: string }>;
}) {
  await requirePermission("dashboard.read");
  const params = await searchParams;
  const db = createServiceRoleClient();
  const now = requestTime();

  const [canSeeStudents, canSupport, canNotify, canStories, coursesRes, ticketsRes] = await Promise.all([
    hasPermission("users.manage"),
    hasPermission("support.manage"),
    hasPermission("communications.manage"),
    hasPermission("cases.manage"),
    db.from("courses").select("id,title,all_students").eq("status", "published").order("title"),
    db.from("support_tickets").select("id", { head: true, count: "exact" }).in("status", ["open", "in_progress"]),
  ]);
  queryError(coursesRes.error);
  const courses = (coursesRes.data || []) as { id: string; title: string; all_students: boolean }[];
  const course = courses.find((c) => c.id === params.curso) ?? courses[0];
  const openTickets = ticketsRes.error ? null : ticketsRes.count ?? 0;

  const shortcuts = [
    canSeeStudents && { href: "/admin/users/new", label: "Cadastrar aluno", icon: UserPlus },
    canNotify && { href: "/admin/communications", label: "Enviar aviso", icon: BellPlus },
    canStories && { href: "/admin/stories", label: "Novo story", icon: Clapperboard },
    { href: "/admin/courses", label: "Ver cursos", icon: BookOpen },
  ].filter(Boolean) as { href: string; label: string; icon: typeof UserPlus }[];

  const header = (
    <section className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[.08em] text-[var(--admin-tint)]">Painel</p>
        <h1 className="mt-1 text-[30px] md:text-[38px]">Progresso dos alunos</h1>
        <p className="mt-1 max-w-xl text-[15px] text-[var(--admin-secondary)]">
          Quem tem acesso, quem está avançando e quem precisa de um empurrão.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[var(--admin-label)] shadow-[var(--admin-shadow)] hover:text-[var(--admin-tint)]">
            <Icon size={16} aria-hidden="true" className="text-[var(--admin-tint)]" /> {label}
          </Link>
        ))}
      </div>
    </section>
  );

  if (!course) {
    return (
      <div className="space-y-6">
        {header}
        <section className="amf-panel text-center">
          <p className="font-semibold">Nenhum curso publicado ainda.</p>
          <p className="mt-1 text-sm text-[var(--admin-secondary)]">Publique um curso para acompanhar o progresso dos alunos aqui.</p>
        </section>
      </div>
    );
  }

  const [lessonRows, grants, progress, certificates] = await Promise.all([
    allRows(db, "lessons", "id,title,order_index,course_modules!inner(course_id,order_index,status)", (q) =>
      q.eq("course_modules.course_id", course.id).eq("course_modules.status", "published").eq("status", "published"),
    ),
    allRows(db, "entitlements", "id,profile_id,status,starts_at,expires_at,created_at", (q) =>
      q.eq("resource_type", "course").eq("resource_id", course.id),
    ),
    allRows(db, "lesson_progress", "id,profile_id,lesson_id,is_completed,updated_at,completed_at", (q) => q.eq("course_id", course.id)),
    allRows(db, "certificates", "id,profile_id", (q) => q.eq("course_id", course.id)),
  ]);
  const grantIds = [...new Set(grants.map((g: { profile_id: string }) => g.profile_id))] as string[];
  const profiles = await profilesFor(db, grantIds, course.all_students);
  const lessons = lessonRows.map((l: { id: string; title: string; order_index: number; course_modules: { order_index: number } }) => ({
    id: l.id,
    title: l.title,
    order: l.order_index ?? 0,
    moduleOrder: l.course_modules?.order_index ?? 0,
  }));
  const students = summarizeStudents({ lessons, grants, progress, profiles, certificates, allStudents: course.all_students, now });
  const kpis = progressKpis(students, now);
  const funnel = courseFunnel(students);
  const stuck = stuckLessons(students);
  const weeks = weeklyActivity(progress, now);
  const maxWeek = Math.max(1, ...weeks.map((w) => w.completions));
  const counts = Object.fromEntries(STATES.map((s) => [s.key, s.key === "todos" ? students.length : students.filter((st) => st.state === s.key).length]));

  const filter = (STATES.find((s) => s.key === params.filtro)?.key ?? "todos") as StudentState | "todos";
  const query = (params.q || "").trim().toLowerCase();
  const listed = students
    .filter((s) => filter === "todos" || s.state === filter)
    .filter((s) => !query || s.name.toLowerCase().includes(query) || (s.email || "").toLowerCase().includes(query))
    .sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || "") || a.name.localeCompare(b.name));
  const attention = students
    .filter((s) => s.state === "nunca" || s.state === "parado")
    .sort((a, b) => (a.lastActivity || a.accessSince).localeCompare(b.lastActivity || b.accessSince))
    .slice(0, 6);

  const href = (next: { curso?: string; filtro?: string; q?: string }) => {
    const sp = new URLSearchParams();
    const merged = { curso: course.id, filtro: filter, q: params.q || "", ...next };
    if (merged.curso && courses.length > 1) sp.set("curso", merged.curso);
    if (merged.filtro && merged.filtro !== "todos") sp.set("filtro", merged.filtro);
    if (merged.q) sp.set("q", merged.q);
    const qs = sp.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

  const cards = [
    { label: "Alunos com acesso", value: kpis.students, hint: `${kpis.new7} novos nos últimos 7 dias` },
    { label: "Ativos em 30 dias", value: kpis.active30, hint: kpis.students ? `${Math.round((kpis.active30 / kpis.students) * 100)}% da turma` : "—" },
    { label: "Conclusão média", value: `${kpis.averagePercent}%`, hint: `${counts.concluiu} concluíram o curso` },
    { label: "Certificados", value: kpis.certificates, hint: "emitidos neste curso" },
  ];

  return (
    <div className="space-y-6">
      {header}

      {courses.length > 1 && (
        <nav aria-label="Escolher curso" className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={href({ curso: c.id, filtro: "todos", q: "" })}
              aria-current={c.id === course.id ? "page" : undefined}
              className={`min-h-9 rounded-full px-4 py-2 text-sm font-medium ${c.id === course.id ? "bg-[var(--admin-tint)] text-white" : "bg-white text-[var(--admin-label)] shadow-[var(--admin-shadow)]"}`}
            >
              {c.title}
            </Link>
          ))}
        </nav>
      )}
      {courses.length === 1 && <p className="text-sm text-[var(--admin-secondary)]">Curso: <strong className="text-[var(--admin-label)]">{course.title}</strong></p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Números do curso">
        {cards.map((card) => (
          <div key={card.label} className="amf-panel">
            <p className="text-[13px] font-medium text-[var(--admin-secondary)]">{card.label}</p>
            <p className="mt-1 text-[32px] font-bold tabular-nums leading-tight">{card.value}</p>
            <p className="mt-1 text-[12.5px] text-[var(--admin-tertiary)]">{card.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="amf-panel" aria-labelledby="funil">
          <h2 id="funil" className="text-[17px]">Caminho da turma</h2>
          <p className="mt-1 text-sm text-[var(--admin-secondary)]">De quem recebeu acesso até quem emitiu o certificado.</p>
          <ol className="mt-5 space-y-3">
            {funnel.map((step) => {
              const pct = funnel[0].value ? Math.round((step.value / funnel[0].value) * 100) : 0;
              return (
                <li key={step.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{step.label}</span>
                    <span className="tabular-nums text-[var(--admin-secondary)]"><strong className="text-[var(--admin-label)]">{step.value}</strong> · {pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--admin-fill)]">
                    <div className="h-full rounded-full bg-[var(--admin-tint)]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="amf-panel" aria-labelledby="atividade">
          <h2 id="atividade" className="text-[17px]">Aulas concluídas por semana</h2>
          <p className="mt-1 text-sm text-[var(--admin-secondary)]">Últimas 12 semanas. Passe o mouse para ver os alunos ativos.</p>
          <div className="mt-5 flex h-40 items-end gap-1.5" role="img" aria-label={`Aulas concluídas por semana: ${weeks.map((w) => w.completions).join(", ")}`}>
            {weeks.map((w) => (
              <div key={w.weekStart} className="group relative flex h-full flex-1 flex-col justify-end" title={`Semana de ${dateBR(w.weekStart)}: ${w.completions} aulas concluídas, ${w.active} alunos ativos`}>
                <span className="mb-1 text-center text-[10.5px] tabular-nums text-[var(--admin-secondary)]">{w.completions || ""}</span>
                <div className="rounded-t-[5px] bg-[var(--admin-tint)] opacity-80 transition-opacity group-hover:opacity-100" style={{ height: `${Math.max(2, (w.completions / maxWeek) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[var(--admin-tertiary)]">
            <span>{dateBR(weeks[0].weekStart)}</span>
            <span>hoje</span>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="amf-panel" aria-labelledby="param">
          <h2 id="param" className="text-[17px]">Onde os alunos param</h2>
          <p className="mt-1 text-sm text-[var(--admin-secondary)]">A próxima aula de quem começou e ainda não terminou.</p>
          {stuck.length ? (
            <ul className="mt-4 divide-y divide-[var(--admin-separator)]">
              {stuck.map((s) => (
                <li key={s.lesson} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">{s.lesson}</span>
                  <span className="shrink-0 rounded-full bg-[var(--admin-fill)] px-2.5 py-0.5 text-xs font-semibold tabular-nums">{s.count} {s.count === 1 ? "aluno" : "alunos"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--admin-secondary)]">Ninguém travado no meio do curso agora.</p>
          )}
        </section>

        <section className="amf-panel" aria-labelledby="atencao">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="atencao" className="text-[17px]">Precisam de atenção</h2>
              <p className="mt-1 text-sm text-[var(--admin-secondary)]">Nunca começaram ou estão parados há mais de {STALLED_DAYS} dias.</p>
            </div>
            {canSupport && openTickets !== null && (
              <Link href="/admin/support" className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--admin-fill)] px-3 py-1.5 text-xs font-semibold">
                <LifeBuoy size={14} aria-hidden="true" /> {openTickets} {openTickets === 1 ? "chamado aberto" : "chamados abertos"}
              </Link>
            )}
          </div>
          {!canSeeStudents ? (
            <p className="mt-4 text-sm text-[var(--admin-secondary)]">{counts.nunca + counts.parado} alunos. Os nomes aparecem para quem gerencia alunos.</p>
          ) : attention.length ? (
            <ul className="mt-4 divide-y divide-[var(--admin-separator)]">
              {attention.map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/users/${s.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-[var(--admin-tint)]">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.name}</span>
                      <span className="block truncate text-xs text-[var(--admin-secondary)]">
                        {s.state === "nunca" ? `Acesso desde ${dateBR(s.accessSince)}` : `Última atividade em ${dateBR(s.lastActivity)} · ${s.percent}%`}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE_STYLE[s.state]}`}>{STATE_LABEL[s.state]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--admin-secondary)]">Todo mundo está em dia.</p>
          )}
        </section>
      </div>

      {canSeeStudents && (
        <section className="amf-panel" aria-labelledby="alunos">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 id="alunos" className="text-[17px]">Alunos do curso</h2>
            <form action="/admin" className="flex gap-2" role="search">
              {courses.length > 1 && <input type="hidden" name="curso" value={course.id} />}
              {filter !== "todos" && <input type="hidden" name="filtro" value={filter} />}
              <input name="q" defaultValue={params.q || ""} placeholder="Buscar por nome ou e-mail" aria-label="Buscar aluno" className="min-h-10 w-full lg:w-72" />
              <button className="amf-secondary min-h-10 shrink-0 px-4">Buscar</button>
            </form>
          </div>
          <nav aria-label="Filtrar alunos" className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {STATES.map((s) => (
              <Link
                key={s.key}
                href={href({ filtro: s.key })}
                aria-current={filter === s.key ? "page" : undefined}
                className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium ${filter === s.key ? "bg-[var(--admin-label)] text-white" : "bg-[var(--admin-fill)] text-[var(--admin-label)]"}`}
              >
                {s.label} <span className="tabular-nums opacity-70">{counts[s.key]}</span>
              </Link>
            ))}
          </nav>
          {listed.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs text-[var(--admin-secondary)]">
                  <tr className="border-b border-[var(--admin-separator)]">
                    <th className="py-2.5 pr-3 font-medium">Aluno</th>
                    <th className="py-2.5 pr-3 font-medium">Progresso</th>
                    <th className="py-2.5 pr-3 font-medium">Última aula</th>
                    <th className="py-2.5 pr-3 font-medium">Última atividade</th>
                    <th className="py-2.5 pr-3 font-medium">Certificado</th>
                    <th className="py-2.5 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-separator)]">
                  {listed.slice(0, PAGE_SIZE).map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 pr-3">
                        <Link href={`/admin/users/${s.id}`} className="font-medium hover:text-[var(--admin-tint)]">{s.name}</Link>
                        <p className="text-xs text-[var(--admin-secondary)]">{s.email}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--admin-fill)]">
                            <div className="h-full rounded-full bg-[var(--admin-tint)]" style={{ width: `${s.percent}%` }} />
                          </div>
                          <span className="tabular-nums text-xs">{s.percent}% · {s.completed}/{s.total}</span>
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate py-3 pr-3">{s.lastLesson || "—"}</td>
                      <td className="py-3 pr-3 tabular-nums">{dateBR(s.lastActivity)}</td>
                      <td className="py-3 pr-3">{s.certificate ? "Emitido" : "—"}</td>
                      <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE_STYLE[s.state]}`}>{STATE_LABEL[s.state]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {listed.length > PAGE_SIZE && (
                <p className="mt-3 text-xs text-[var(--admin-secondary)]">Mostrando {PAGE_SIZE} de {listed.length}. Use a busca ou os filtros para encontrar um aluno.</p>
              )}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-[var(--admin-secondary)]">Nenhum aluno neste filtro.</p>
          )}
        </section>
      )}
    </div>
  );
}
