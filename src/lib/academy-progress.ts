export interface AcademyLesson { id: string; module_id: string; status: string; }
export interface AcademyModule { id: string; course_id: string; status: string; }
export interface AcademyLessonProgress { lesson_id: string; is_completed: boolean; progress_percent: number | null; }
export interface CourseCompletion { total: number; completed: number; percent: number; }
export function courseCompletion(
  courseId: string,
  modules: AcademyModule[],
  lessons: AcademyLesson[],
  progress: AcademyLessonProgress[],
): CourseCompletion {
  const moduleIds = new Set(modules.filter(m => m.course_id === courseId && m.status === "published").map(m => m.id));
  const visible = lessons.filter(l => l.status === "published" && moduleIds.has(l.module_id));
  const completedIds = new Set(progress.filter(p => p.is_completed).map(p => p.lesson_id));
  const completed = visible.filter(l => completedIds.has(l.id)).length;
  return { total: visible.length, completed, percent: visible.length ? Math.round(completed / visible.length * 100) : 0 };
}
export interface AcademyEntitlement {
  resource_id: string; resource_type: string; status: string; starts_at: string | null; expires_at: string | null;
}
export function courseIsAccessible(
  course: { id: string; status: string; all_students: boolean },
  entitlements: AcademyEntitlement[],
  now: number,
) {
  if (course.status !== "published") return false;
  return course.all_students || entitlements.some(e =>
    e.resource_id === course.id && e.resource_type === "course" && e.status === "active" &&
    e.starts_at !== null && Date.parse(e.starts_at) <= now &&
    (e.expires_at === null || Date.parse(e.expires_at) > now),
  );
}
