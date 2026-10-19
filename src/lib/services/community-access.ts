import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getUserEntitlements, isCurrentGrant } from './access';

export function isSafeCommunityUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      ['chat.whatsapp.com', 'wa.me', 'api.whatsapp.com'].includes(url.hostname) && url.pathname.length > 1;
  } catch { return false; }
}

export type CommunityAccess = {
  state: 'unauthenticated' | 'locked' | 'unavailable' | 'available';
  links: { id: string; title: string; href: string }[];
};

export async function getCommunityAccess(): Promise<CommunityAccess> {
  try {
    const db = await createClient();
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return { state: 'unauthenticated', links: [] };
    const entitlements = await getUserEntitlements(user.id);
    const courseIds = [...new Set(entitlements.filter((grant) =>
      grant.resource_type === 'course' && isCurrentGrant(grant)).map((grant) => grant.resource_id))];
    if (!courseIds.length) return { state: 'locked', links: [] };

    // Private destinations are read only after a verified, explicit course grant.
    const admin = createServiceRoleClient();
    const { data: lessons, error: lessonError } = await admin.from('lessons')
      .select('id,title,external_resource_id,course_modules!inner(course_id,status,courses!inner(slug,status))')
      .eq('type', 'external_link').eq('status', 'published')
      .eq('course_modules.status', 'published').eq('course_modules.courses.status', 'published')
      .in('course_modules.course_id', courseIds);
    if (lessonError || !lessons?.length) return { state: 'unavailable', links: [] };
    type GroupLesson = { id: string; title: string; external_resource_id: string | null; course_modules: { course_id: string; courses: { slug: string } } };
    const candidates = (lessons as unknown as GroupLesson[]).filter((lesson) =>
      lesson.external_resource_id && courseIds.includes(lesson.course_modules.course_id));
    if (!candidates.length) return { state: 'unavailable', links: [] };
    const { data: resources, error: resourceError } = await admin.from('external_resources')
      .select('id,private_destination_url').eq('status', 'active')
      .in('id', candidates.map((lesson) => lesson.external_resource_id!));
    if (resourceError) return { state: 'unavailable', links: [] };
    const safeIds = new Set((resources || []).filter((resource: { id: string; private_destination_url: string }) =>
      isSafeCommunityUrl(resource.private_destination_url)).map((resource: { id: string }) => resource.id));
    const links = candidates.filter((lesson) => safeIds.has(lesson.external_resource_id!)).map((lesson) => ({
      id: lesson.id, title: lesson.title,
      href: `/api/courses/${encodeURIComponent(lesson.course_modules.courses.slug)}/lesson/${encodeURIComponent(lesson.id)}/whatsapp`,
    }));
    return { state: links.length ? 'available' : 'unavailable', links };
  } catch { return { state: 'unavailable', links: [] }; }
}
