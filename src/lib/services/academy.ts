import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getFeatureFlags } from "@/lib/services/flags";
import { buildAcademyPaths, type AcademyPathRow, type AcademyPhaseRow, type AcademyStepRow, type AcademyPrerequisite, type AcademyTarget } from "@/lib/academy-model";
import { courseCompletion, courseIsAccessible, type AcademyModule, type AcademyLesson, type AcademyLessonProgress, type AcademyEntitlement } from "@/lib/academy-progress";

interface CourseRow { id: string; slug: string; title: string; status: string; all_students: boolean; }
interface CaseRow { id: string; title: string; }
interface CaseProgressRow { case_id: string; status: string; }
function checked<T>(result: { data: T | null; error: unknown }, fallback: T): T {
  if (result.error) throw new Error("Não foi possível carregar a Academia.");
  return result.data ?? fallback;
}

// Bound IN lists and paginate every chunk: Supabase's row cap must not turn a
// partially loaded course into a completed one.
async function batchRows<T>(
  ids: string[],
  query: (batch: string[], first: number, last: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; start < ids.length; start += 150) {
    const batch = ids.slice(start, start + 150);
    for (let offset = 0; ; offset += 500) {
      const page = checked<T[]>(await query(batch, offset, offset + 499), []);
      rows.push(...page);
      if (page.length < 500) break;
    }
  }
  return rows;
}
export async function getAcademyData() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { state: "signed_out" as const };
  const flags = await getFeatureFlags();
  if (!flags.member_academy_enabled) return { state: "disabled" as const };

  // Academy configuration has no authenticated RLS grants. Only enter the privileged
  // read after validating a real session and the member feature flag.
  const db = createServiceRoleClient();
  const paths = checked<AcademyPathRow[]>(await db.from("academy_paths")
    .select("id,title,description,status").eq("status", "published").order("created_at"), []);
  if (!paths.length) return { state: "ready" as const, paths: [] };
  const phases = checked<AcademyPhaseRow[]>(await db.from("academy_phases")
    .select("id,path_id,title,position").in("path_id", paths.map(p => p.id)).order("position"), []);
  if (!phases.length) return { state: "ready" as const, paths: buildAcademyPaths(paths, [], [], [], []) };
  const steps = checked<AcademyStepRow[]>(await db.from("academy_steps")
    .select("id,phase_id,position,step_type,target_id,title_override,status")
    .in("phase_id", phases.map(p => p.id)).eq("status", "published").order("position"), []);
  if (!steps.length) return { state: "ready" as const, paths: buildAcademyPaths(paths, phases, [], [], []) };

  const courseIds = [...new Set(steps.filter(s => s.step_type === "course").map(s => s.target_id))];
  const caseIds = [...new Set(steps.filter(s => s.step_type === "case").map(s => s.target_id))];
  const prerequisites = checked<AcademyPrerequisite[]>(await db.from("academy_prerequisites")
    .select("step_id,prerequisite_step_id").in("step_id", steps.map(s => s.id)), []);
  const targets: AcademyTarget[] = [];

  if (flags.member_courses_enabled && courseIds.length) {
    // Catalog, rights, modules and lessons always use the authenticated client.
    // Batch queries avoid an entitlement/progress request for each step or course.
    const [courseResult, entitlementResult] = await Promise.all([
      client.from("courses").select("id,slug,title,status,all_students").in("id", courseIds).eq("status", "published"),
      client.from("entitlements").select("resource_id,resource_type,status,starts_at,expires_at")
        .eq("profile_id", user.id).eq("resource_type", "course").eq("status", "active").in("resource_id", courseIds),
    ]);
    const entitlements = checked<AcademyEntitlement[]>(entitlementResult, []);
    const now = Date.now();
    const courses = checked<CourseRow[]>(courseResult, []).filter(c => courseIsAccessible(c, entitlements, now));
    if (courses.length) {
      const modules = await batchRows<AcademyModule>(courses.map(c => c.id), (ids, first, last) => client.from("course_modules")
        .select("id,course_id,status").in("course_id", ids).eq("status", "published").order("id").range(first, last));
      if (modules.length) {
        const lessons = await batchRows<AcademyLesson>(modules.map(m => m.id), (ids, first, last) => client.from("lessons")
          .select("id,module_id,status").in("module_id", ids).eq("status", "published").order("id").range(first, last));
        if (lessons.length) {
          const progress = await batchRows<AcademyLessonProgress>(lessons.map(l => l.id), (ids, first, last) => client.from("lesson_progress")
            .select("lesson_id,is_completed,progress_percent").eq("profile_id", user.id).in("lesson_id", ids).order("lesson_id").range(first, last));
          for (const course of courses) {
            const completion = courseCompletion(course.id, modules, lessons, progress);
            if (!completion.total) continue;
            targets.push({ id: course.id, type: "course", title: course.title,
              href: "/app/cursos/" + encodeURIComponent(course.slug), percent: completion.percent,
              completed: completion.completed === completion.total,
              detail: completion.completed + " de " + completion.total + " aulas concluídas" });
          }
        }
      }
    }
  }

  if (flags.member_cases_enabled && caseIds.length) {
    // Match the existing story catalog's publication and visibility authorization.
    const cases = checked<CaseRow[]>(await db.from("cases")
      .select("id,title,case_story_videos!inner(id)").in("id", caseIds).eq("status", "published")
      .in("visibility", ["free", "authenticated"]).eq("case_story_videos.status", "published"), []);
    if (cases.length) {
      // Legacy completion records are read only for this verified user and accessible cases.
      // The current story viewer does not write completions; never infer one from a visit.
      const result = await client.from("case_progress").select("case_id,status")
        .eq("profile_id", user.id).in("case_id", cases.map(c => c.id));
      const progress = result.error ? [] : (result.data || []) as CaseProgressRow[];
      for (const item of cases) {
        const completed = progress.some(p => p.case_id === item.id && p.status === "completed");
        targets.push({ id: item.id, type: "case", title: item.title, href: "/app/casos",
          completed, percent: completed ? 100 : 0,
          detail: completed ? "Conclusão registrada" : "Stories disponíveis · conclusão ainda não registrada" });
      }
    }
  }
  return { state: "ready" as const, paths: buildAcademyPaths(paths, phases, steps, prerequisites, targets) };
}

