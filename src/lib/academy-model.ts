export interface AcademyStepRow {
  id: string; phase_id: string; position: number; step_type: string; target_id: string;
  title_override: string | null; status: string;
}
export interface AcademyPhaseRow { id: string; path_id: string; title: string; position: number; }
export interface AcademyPathRow { id: string; title: string; description: string | null; status: string; }
export interface AcademyPrerequisite { step_id: string; prerequisite_step_id: string; }
export interface AcademyTarget {
  id: string; type: "course" | "case"; title: string; href: string;
  percent: number; completed: boolean; detail: string;
}
export interface AcademyStepView extends AcademyTarget {
  stepId: string; locked: boolean; blockedReason: string | null;
}
export interface AcademyPhaseView { id: string; title: string; steps: AcademyStepView[]; }
export interface AcademyPathView {
  id: string; title: string; description: string | null; phases: AcademyPhaseView[];
  completed: number; total: number; percent: number;
}
export function buildAcademyPaths(
  paths: AcademyPathRow[], phases: AcademyPhaseRow[], steps: AcademyStepRow[],
  prerequisites: AcademyPrerequisite[], targets: AcademyTarget[],
): AcademyPathView[] {
  const targetMap = new Map(targets.map(t => [t.type + ":" + t.id, t]));
  const order = <T extends { position: number; id: string }>(a: T, b: T) => a.position - b.position || a.id.localeCompare(b.id);
  return paths.filter(p => p.status === "published").map(path => {
    const pathPhases = phases.filter(p => p.path_id === path.id).sort(order);
    const phaseIds = new Set(pathPhases.map(p => p.id));
    const visibleSteps = steps.filter(s => s.status === "published" && phaseIds.has(s.phase_id) && targetMap.has(s.step_type + ":" + s.target_id));
    const stepMap = new Map(visibleSteps.map(s => [s.id, s]));
    const dependencies = new Map<string, string[]>();
    for (const pre of prerequisites) {
      const existing = dependencies.get(pre.step_id) || [];
      existing.push(pre.prerequisite_step_id);
      dependencies.set(pre.step_id, existing);
    }
    // Missing, unpublished and cyclic prerequisites fail closed without disclosing their titles.
    const memo = new Map<string, boolean>();
    function effectivelyComplete(id: string, visiting = new Set<string>()): boolean {
      if (visiting.has(id)) return false;
      if (memo.has(id)) return memo.get(id)!;
      const step = stepMap.get(id);
      if (!step) return false;
      const target = targetMap.get(step.step_type + ":" + step.target_id)!;
      const next = new Set(visiting).add(id);
      const complete = target.completed && (dependencies.get(id) || []).every(pre => effectivelyComplete(pre, next));
      memo.set(id, complete);
      return complete;
    }
    const views = pathPhases.map(phase => ({
      id: phase.id, title: phase.title,
      steps: visibleSteps.filter(s => s.phase_id === phase.id).sort(order).map(step => {
        const target = targetMap.get(step.step_type + ":" + step.target_id)!;
        const deps = dependencies.get(step.id) || [];
        const locked = !deps.every(pre => effectivelyComplete(pre, new Set([step.id])));
        return { ...target, title: step.title_override?.trim() || target.title, stepId: step.id, locked,
          completed: !locked && target.completed,
          blockedReason: locked ? (deps.some(pre => !stepMap.has(pre)) ? "Uma etapa anterior está indisponível." : "Conclua os pré-requisitos para continuar.") : null };
      }),
    })).filter(p => p.steps.length);
    const all = views.flatMap(p => p.steps);
    const completed = all.filter(s => s.completed).length;
    return { id: path.id, title: path.title, description: path.description, phases: views, completed, total: all.length,
      percent: all.length ? Math.round(completed / all.length * 100) : 0 };
  });
}
