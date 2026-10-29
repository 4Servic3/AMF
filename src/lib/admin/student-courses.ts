/** Progresso de um aluno, curso a curso e aula a aula, para a ficha do aluno no admin. */
type CourseRow = { id: string; title: string };
type LessonRow = {
  id: string;
  title: string;
  type: string;
  order_index: number | null;
  course_modules: { id: string; title: string; order_index: number | null; course_id: string } | null;
};
type ProgressRow = { lesson_id: string; is_completed: boolean; progress_percent: number | string | null; updated_at: string };

export type LessonState = "concluida" | "andamento" | "pendente";
export type StudentCourse = {
  id: string;
  title: string;
  hasAccess: boolean;
  completed: number;
  total: number;
  percent: number;
  lastActivity: string | null;
  modules: { id: string; title: string; lessons: { id: string; title: string; type: string; state: LessonState; percent: number }[] }[];
};

export function buildStudentCourses(input: {
  courses: CourseRow[];
  lessons: LessonRow[];
  progress: ProgressRow[];
  accessibleCourseIds: Set<string>;
}): StudentCourse[] {
  const progress = new Map(input.progress.map((p) => [p.lesson_id, p]));
  return input.courses.flatMap((course) => {
    const lessons = input.lessons
      .filter((l) => l.course_modules?.course_id === course.id)
      .sort((a, b) => (a.course_modules!.order_index ?? 0) - (b.course_modules!.order_index ?? 0) || (a.order_index ?? 0) - (b.order_index ?? 0));
    const started = lessons.some((l) => progress.has(l.id));
    const hasAccess = input.accessibleCourseIds.has(course.id);
    if (!lessons.length || (!hasAccess && !started)) return [];
    const modules: StudentCourse["modules"] = [];
    let completed = 0;
    let lastActivity: string | null = null;
    for (const lesson of lessons) {
      const p = progress.get(lesson.id);
      const percent = p ? (p.is_completed ? 100 : Math.round(Number(p.progress_percent) || 0)) : 0;
      const state: LessonState = p?.is_completed ? "concluida" : p ? "andamento" : "pendente";
      if (state === "concluida") completed++;
      if (p && (!lastActivity || p.updated_at > lastActivity)) lastActivity = p.updated_at;
      const mod = lesson.course_modules!;
      let bucket = modules.find((m) => m.id === mod.id);
      if (!bucket) modules.push((bucket = { id: mod.id, title: mod.title, lessons: [] }));
      bucket.lessons.push({ id: lesson.id, title: lesson.title, type: lesson.type, state, percent });
    }
    return [{
      id: course.id,
      title: course.title,
      hasAccess,
      completed,
      total: lessons.length,
      percent: Math.round((completed / lessons.length) * 100),
      lastActivity,
      modules,
    }];
  });
}
