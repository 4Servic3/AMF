import { adminDb, queryError } from "@/lib/admin-data";
import { notFound } from "next/navigation";
import UserCrmClient from "./client";
import { buildStudentCourses } from "@/lib/admin/student-courses";
export default async function UserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = await adminDb("users.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: user, error } = await db
    .from("profiles")
    .select("id,full_name,email,created_at")
    .eq("id", id)
    .maybeSingle();
  queryError(error);
  if (!user) notFound();
  const [access, notes, progress, courses, products, auth] = await Promise.all([
    db.from("entitlements").select("*").eq("profile_id", id),
    db
      .from("user_internal_notes")
      .select("*")
      .eq("target_profile_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("lesson_progress")
      .select("id,lesson_id,is_completed,progress_percent,updated_at,lesson:lessons(title)")
      .eq("profile_id", id),
    db.from("courses").select("id,title,status,all_students").order("title"),
    db.from("products").select("id,name,type,status").order("sort_order").order("name"),
    db.auth.admin.getUserById(id),
  ]);
  [access, notes, progress, courses, products, auth].forEach((r) => queryError(r.error));
  // Grade dos cursos que o aluno pode abrir ou já começou, para o progresso aula por aula.
  const progressCourses = new Set<string>([
    ...(access.data || []).filter((e: { resource_type: string; status: string }) => e.resource_type === "course" && e.status === "active").map((e: { resource_id: string }) => e.resource_id),
    ...(courses.data || []).filter((c: { all_students: boolean; status: string }) => c.all_students && c.status === "published").map((c: { id: string }) => c.id),
  ]);
  const lessonRows = progressCourses.size || progress.data?.length
    ? await db
        .from("lessons")
        .select("id,title,type,order_index,status,course_modules!inner(id,title,order_index,course_id,status)")
        .eq("status", "published")
        .eq("course_modules.status", "published")
    : { data: [], error: null };
  queryError(lessonRows.error);
  // Request-time server data: suspension must use the current server clock.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <UserCrmClient
      user={{
        ...user,
        suspended: Date.parse(auth.data.user.banned_until || "") > now,
      }}
      entitlements={access.data}
      notes={notes.data}
      progress={progress.data}
      learning={buildStudentCourses({
        courses: courses.data || [],
        lessons: lessonRows.data || [],
        progress: progress.data || [],
        accessibleCourseIds: progressCourses,
      })}
      courses={courses.data}
      products={products.data}
    />
  );
}
