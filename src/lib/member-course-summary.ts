import { lessonPathSegment } from './lesson-route';
export type MemberCourse = { id: string; product_id?: string | null; title: string; slug: string; thumbnail_url: string | null; short_description: string | null; all_students: boolean; media_assets?: { file_path: string | null } | { file_path: string | null }[] | null };
export type MemberLesson = { id: string; module_id: string; title: string; slug: string; type: string; is_mandatory: boolean; course_modules: { course_id: string } | { course_id: string }[] };
export type MemberProgress = { lesson_id: string; progress_percent: number; is_completed: boolean; updated_at: string };
export function summarizeMemberCourses(courses: MemberCourse[], lessons: MemberLesson[], progress: MemberProgress[]) {
  const progressByLesson = new Map(progress.map(p => [p.lesson_id, p]));
  const byCourse = new Map<string, MemberLesson[]>();
  for (const lesson of lessons) {
    const courseModule = Array.isArray(lesson.course_modules) ? lesson.course_modules[0] : lesson.course_modules;
    if (!courseModule) continue;
    const list = byCourse.get(courseModule.course_id) || []; list.push(lesson); byCourse.set(courseModule.course_id, list);
  }
  return courses.map(course => {
    const published = byCourse.get(course.id) || [];
    const required = published.filter(l => l.type === 'video' && l.is_mandatory);
    const percent = (l: MemberLesson) => { const p = progressByLesson.get(l.id); const value = Number(p?.progress_percent || 0); return p?.is_completed ? 100 : Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0; };
    const rawPercent = required.length ? required.reduce((sum, l) => sum + percent(l), 0) / required.length : 0;
    const started = published.some(l => progressByLesson.has(l.id));
    // Alguns minutos de uma aula longa somem no arredondamento; quem já começou nunca vê 0%.
    const progressPercent = started ? Math.max(1, Math.round(rawPercent)) : Math.round(rawPercent);
    const completed = required.length > 0 && required.every(l => progressByLesson.get(l.id)?.is_completed === true);
    const last = published.filter(l => progressByLesson.has(l.id)).sort((a,b) => Date.parse(progressByLesson.get(b.id)!.updated_at) - Date.parse(progressByLesson.get(a.id)!.updated_at))[0];
    return { courseId: course.id, courseTitle: course.title, courseSlug: course.slug, coverUrl: course.thumbnail_url, lastLessonTitle: last?.title, lastLessonSlug: last ? lessonPathSegment(last) : undefined, progressPercent, status: completed ? 'completed' as const : started ? 'in_progress' as const : 'not_started' as const };
  }).sort((a,b) => Number(b.status === 'in_progress') - Number(a.status === 'in_progress'));
}
