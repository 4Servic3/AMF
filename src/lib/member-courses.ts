import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/auth-user';
import { getMemberAccess } from '@/lib/access/member-access';
import { summarizeMemberCourses, type MemberCourse, type MemberLesson, type MemberProgress } from './member-course-summary';
const PAGE = 500;
export async function collectMemberRows<T>(query: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const result = await query(from, from + PAGE - 1);
    if (result.error || !Array.isArray(result.data)) throw new Error('Não foi possível carregar seus cursos. Tente novamente.');
    rows.push(...result.data as T[]);
    if (result.data.length < PAGE) return rows;
  }
}
// React cache is request-scoped: private progress is never cached across users.
export const loadMemberCourses = cache(async () => {
  const db = await createClient();
  const { data: { user }, error } = await getAuthUser();
  if (error || !user) return { userId: null, catalog: [] as MemberCourse[], summaries: [] };
  const [catalog, access] = await Promise.all([
    collectMemberRows<MemberCourse>((from,to) => db.from('courses').select('id,product_id,title,slug,thumbnail_url,short_description,all_students,media_assets!cover_asset_id(file_path)').eq('status','published').order('id').range(from,to)),
    getMemberAccess(),
  ]);
  if (access.state === 'unavailable') throw new Error('Não foi possível verificar seus acessos. Tente novamente.');
  // Mesma regra do banco (has_course_access): grant vigente ou liberação geral do curso.
  const accessible = catalog.filter(c => access.courseIds.has(c.id));
  const lessons: MemberLesson[] = [], progress: MemberProgress[] = [];
  // Bounded IN filters avoid long URLs, without one query per course.
  for (let offset = 0; offset < accessible.length; offset += 100) {
    const courseIds = accessible.slice(offset,offset+100).map(c => c.id);
    const [batchLessons, batchProgress] = await Promise.all([
      collectMemberRows<MemberLesson>((from,to) => db.from('lessons').select('id,module_id,title,slug,type,is_mandatory,course_modules!inner(course_id)').in('course_modules.course_id',courseIds).eq('course_modules.status','published').eq('status','published').order('id').range(from,to)),
      collectMemberRows<MemberProgress>((from,to) => db.from('lesson_progress').select('lesson_id,progress_percent,is_completed,updated_at').eq('profile_id',user.id).in('course_id',courseIds).order('id').range(from,to)),
    ]);
    lessons.push(...batchLessons); progress.push(...batchProgress);
  }
  return { userId: user.id, catalog, summaries: summarizeMemberCourses(accessible,lessons,progress) };
});
