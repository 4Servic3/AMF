import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Lock, ArrowRight, GraduationCap } from "lucide-react";
import { getAcademyData } from "@/lib/services/academy";
import type { AcademyPathView } from "@/lib/academy-model";

export default async function AcademyPage() {
  let result: Awaited<ReturnType<typeof getAcademyData>> | null = null;
  try {
    result = await getAcademyData();
  } catch {
    // Render an honest retry state; never substitute example progress on read failure.
  }
  if (result?.state === "signed_out") redirect("/entrar");
  if (result?.state === "disabled") redirect("/app/cursos");
  const paths = result?.state === "ready" ? result.paths : [];
  const next = paths.flatMap(path => path.phases.flatMap(phase => phase.steps))
    .find(step => !step.locked && !step.completed);

  return (
    <div className="min-h-[80dvh] bg-[#FBF7F0] pb-12">
      <header className="bg-gradient-to-br from-[#16051F] to-[#30183D] px-5 pb-12 pt-10 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#D6A63E]">Academia AMF</p>
          <h1 className="font-editorial text-4xl font-bold sm:text-5xl">Sua jornada clínica</h1>
          <p className="mt-4 max-w-xl text-[#D4C5D9]">Acompanhe suas trilhas e avance com os conteúdos disponíveis para você.</p>
          {next && <Link href={next.href} className="mt-6 inline-flex max-w-full items-center gap-3 rounded-2xl bg-[#D6A63E] px-5 py-3 font-semibold text-[#16051F] hover:bg-[#E8BD5A]">
            <span className="min-w-0 break-words">Continuar: {next.title}</span><ArrowRight size={18} className="shrink-0" />
          </Link>}
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-8 px-5 pt-8 sm:px-8">
        {!result && <section role="alert" className="rounded-3xl border border-[#DED5C9] bg-white p-8">
          <h2 className="font-editorial text-2xl">Não foi possível carregar sua jornada</h2>
          <p className="mt-3 text-[#667085]">Seu progresso continua salvo. Atualize a página para tentar novamente.</p>
          <Link href="/app/academia" className="mt-5 inline-flex font-semibold text-[#006B68] underline">Tentar novamente</Link>
        </section>}
        {result?.state === "ready" && !paths.length && <section className="rounded-3xl border border-[#DED5C9] bg-white p-8 text-center">
          <GraduationCap className="mx-auto mb-4 text-[#006B68]" size={36} />
          <h2 className="font-editorial text-2xl">Sua próxima jornada está sendo preparada</h2>
          <p className="mt-3 text-[#667085]">As trilhas aparecerão aqui quando forem publicadas.</p>
          <Link href="/app/cursos" className="mt-5 inline-flex font-semibold text-[#006B68] underline">Ver meus cursos</Link>
        </section>}
        {paths.map(path => <AcademyPath key={path.id} path={path} />)}
      </main>
    </div>
  );
}

function AcademyPath({ path }: { path: AcademyPathView }) {
  return <section aria-labelledby={"path-" + path.id} className="rounded-3xl border border-[#DED5C9] bg-white p-5 shadow-sm sm:p-8">
    <h2 id={"path-" + path.id} className="font-editorial text-3xl font-bold text-[#16051F]">{path.title}</h2>
    {path.description && <p className="mt-3 whitespace-pre-line text-[#667085]">{path.description}</p>}
    {!path.total ? <p className="mt-5 rounded-2xl bg-[#FBF7F0] p-5 text-[#667085]">Ainda não há etapas disponíveis para o seu acesso nesta trilha.</p> : <>
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 text-[#006B68]">
        <strong className="text-3xl">{path.percent}%</strong>
        <span className="text-sm">{path.completed} de {path.total} etapas disponíveis concluídas</span>
      </div>
      <div role="progressbar" aria-label={"Progresso em " + path.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={path.percent} className="mt-3 h-2 overflow-hidden rounded-full bg-[#E6E0D8]">
        <div className="h-full rounded-full bg-[#006B68]" style={{ width: path.percent + "%" }} />
      </div>
      <div className="mt-8 space-y-8">{path.phases.map((phase, index) => <section key={phase.id}>
        <h3 className="mb-4 text-lg font-semibold text-[#16051F]"><span className="mr-2 text-[#B08A36]">Fase {index + 1}</span>{phase.title}</h3>
        <ol className="space-y-3">{phase.steps.map(step => <li key={step.stepId} className="flex gap-4 rounded-2xl border border-[#DED5C9] p-4">
          <span className={"mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full " + (step.completed ? "bg-[#006B68] text-white" : "bg-[#F6F0E8] text-[#006B68]")}>
            {step.locked ? <Lock size={16} aria-label="Bloqueado" /> : step.completed ? <Check size={18} aria-label="Concluído" /> : <GraduationCap size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="break-words font-semibold text-[#10162F]">{step.title}</h4>
            <p className="mt-1 text-sm text-[#667085]">{step.locked ? step.blockedReason : step.detail}</p>
            {!step.locked && <Link href={step.href} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#006B68] underline underline-offset-4">
              {step.type === "case" ? "Ver casos clínicos" : step.completed ? "Revisar curso" : "Abrir curso"}<ArrowRight size={14} />
            </Link>}
          </div>
        </li>)}</ol>
      </section>)}</div>
    </>}
  </section>;
}
