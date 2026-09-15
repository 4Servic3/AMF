import { adminDb, queryError } from "@/lib/admin-data";
import { notFound } from "next/navigation";
import UserCrmClient from "./client";
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
  const [access, notes, progress, courses, auth] = await Promise.all([
    db.from("entitlements").select("*").eq("profile_id", id),
    db
      .from("user_internal_notes")
      .select("*")
      .eq("target_profile_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("lesson_progress")
      .select("id,is_completed,progress_percent,lesson:lessons(title)")
      .eq("profile_id", id),
    db.from("courses").select("id,title").order("title"),
    db.auth.admin.getUserById(id),
  ]);
  [access, notes, progress, courses, auth].forEach((r) => queryError(r.error));
  return (
    <UserCrmClient
      user={{
        ...user,
        suspended: Date.parse(auth.data.user.banned_until || "") > Date.now(),
      }}
      entitlements={access.data}
      notes={notes.data}
      progress={progress.data}
      courses={courses.data}
    />
  );
}
