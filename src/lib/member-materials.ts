import 'server-only';
import { createClient } from '@/lib/supabase/server';
const PAGE_SIZE = 24;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Course = { id: string; title: string; slug: string };
type Module = { course_id: string; courses: Course | Course[] };
type Lesson = { title: string; course_modules: Module | Module[] };
type Row = { id: string; course_id: string; title: string | null; name: string | null; mime_type: string | null; download_policy: string; view_policy: string; lessons: Lesson | Lesson[] };
const one = <T>(value: T | T[]): T | undefined => Array.isArray(value) ? value[0] : value;
export async function loadMemberMaterials(after?: string) {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { userId: null, items: [], nextCursor: null };
  // RLS limits candidates; explicit RPC also checks privileged sessions. Never fetch storage URLs.
  let query = db.from('lesson_materials')
    .select('id,course_id,title,name,mime_type,download_policy,view_policy,lessons!inner(title,course_modules!inner(course_id,courses!inner(id,title,slug)))')
    .eq('status', 'published').eq('lessons.status', 'published')
    .eq('lessons.course_modules.status', 'published').eq('lessons.course_modules.courses.status', 'published')
    .not('storage_path', 'is', null).order('id').limit(PAGE_SIZE + 1);
  if (after && UUID.test(after)) query = query.gt('id', after);
  const result = await query;
  if (result.error || !Array.isArray(result.data)) throw new Error('Não foi possível carregar seus materiais. Tente novamente.');
  const rows = result.data as unknown as Row[], visible = rows.slice(0, PAGE_SIZE), allowed = new Set<string>();
  await Promise.all([...new Set(visible.map(row => row.course_id))].map(async courseId => {
    const access = await db.rpc('has_course_access', { course_uuid: courseId });
    if (access.error) throw new Error('Não foi possível verificar o acesso aos materiais.');
    if (access.data === true) allowed.add(courseId);
  }));
  const items = visible.flatMap(row => {
    const lesson = one(row.lessons), courseModule = lesson && one(lesson.course_modules), course = courseModule && one(courseModule.courses);
    if (!allowed.has(row.course_id) || !course?.slug || courseModule?.course_id !== row.course_id || course.id !== row.course_id) return [];
    const base = '/api/courses/' + encodeURIComponent(course.slug) + '/material/' + encodeURIComponent(row.id);
    return [{ id: row.id, title: row.title || row.name || 'Material da aula', courseTitle: course.title, lessonTitle: lesson!.title,
      courseHref: '/app/cursos/' + encodeURIComponent(course.slug),
      downloadHref: row.download_policy !== 'disabled' ? base + '/download' : null,
      viewHref: row.view_policy !== 'disabled' && row.mime_type === 'application/pdf' ? base + '/view' : null }];
  });
  return { userId: user.id, items, nextCursor: rows.length > PAGE_SIZE ? visible.at(-1)!.id : null };
}
