"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { grantCourseAccess, revokeCourseAccess } from "./courses";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function grantManualAccess(
  userId: string,
  courseId: string,
  reason: string,
) {
  const db = await adminDb("users.manage");
  z.uuid().parse(userId);
  z.string().trim().min(3).max(500).parse(reason);
  const { data, error } = await db
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();
  queryError(error);
  const result = await grantCourseAccess(courseId, data.email, null);
  if (!result.success) throw new Error(result.error);
  await writeAdminAuditEvent({
    action: "grant_access",
    resourceType: "profile",
    resourceId: userId,
    reason,
  });
  revalidatePath("/admin/users/" + userId);
  revalidatePath("/admin/access");
}
export async function revokeAccess(
  userId: string,
  entitlementId: string,
  reason: string,
) {
  const db = await adminDb("users.manage");
  z.uuid().parse(userId);
  z.uuid().parse(entitlementId);
  const { data, error } = await db
    .from("entitlements")
    .select("resource_id,resource_type")
    .eq("id", entitlementId)
    .eq("profile_id", userId)
    .single();
  queryError(error);
  if (data.resource_type === "course") {
    const result = await revokeCourseAccess(data.resource_id, entitlementId);
    if (!result.success) throw new Error(result.error);
  } else {
    const result = await db
      .from("entitlements")
      .update({ status: "revoked" })
      .eq("id", entitlementId)
      .eq("profile_id", userId);
    queryError(result.error);
  }
  await writeAdminAuditEvent({
    action: "revoke_access",
    resourceType: "profile",
    resourceId: userId,
    reason,
  });
  revalidatePath("/admin/users/" + userId);
  revalidatePath("/admin/access");
}
export async function suspendUser(userId: string, reason: string) {
  const session = await requirePermission("users.manage");
  const db = await adminDb("users.manage");
  z.uuid().parse(userId);
  if (userId === session.user.id)
    throw new Error("Você não pode suspender sua própria conta.");
  const { data: roles, error: roleError } = await db
    .from("admin_user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("status", "active");
  queryError(roleError);
  if (roles.length)
    throw new Error(
      "Contas administrativas devem ser gerenciadas pela governança de acesso.",
    );
  const { error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  queryError(error);
  await writeAdminAuditEvent({
    action: "suspend_user",
    resourceType: "profile",
    resourceId: userId,
    reason,
  });
  revalidatePath("/admin/users/" + userId);
}
export async function restoreUser(userId: string) {
  const db = await adminDb("users.manage");
  z.uuid().parse(userId);
  const { error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  queryError(error);
  await writeAdminAuditEvent({
    action: "restore_user",
    resourceType: "profile",
    resourceId: userId,
  });
  revalidatePath("/admin/users/" + userId);
}
export async function addInternalNote(userId: string, note: string) {
  const session = await requirePermission("users.manage");
  const db = await adminDb("users.manage");
  z.uuid().parse(userId);
  const content = z.string().trim().min(1).max(5000).parse(note);
  const { error } = await db
    .from("user_internal_notes")
    .insert({ target_profile_id: userId, author_id: session.user.id, content });
  queryError(error);
  revalidatePath("/admin/users/" + userId);
}
export async function handleDataRequest(
  userId: string,
  actionType: "export" | "anonymize",
) {
  const db = await adminDb("users.manage");
  z.uuid().parse(userId);
  z.enum(["export", "anonymize"]).parse(actionType);
  if (actionType === "anonymize") {
    const { error } = await db
      .from("user_data_requests")
      .insert({
        requester_profile_id: userId,
        type: "deletion",
        status: "open",
      });
    queryError(error);
    await writeAdminAuditEvent({
      action: "request_user_deletion",
      resourceType: "profile",
      resourceId: userId,
    });
    return { requested: true };
  }
  const [profile, access, progress] = await Promise.all([
    db.from("profiles").select("*").eq("id", userId).single(),
    db.from("entitlements").select("*").eq("profile_id", userId),
    db.from("lesson_progress").select("*").eq("profile_id", userId),
  ]);
  [profile, access, progress].forEach((r) => queryError(r.error));
  await writeAdminAuditEvent({
    action: "export_user_data",
    resourceType: "profile",
    resourceId: userId,
  });
  return {
    profile: profile.data,
    access: access.data,
    progress: progress.data,
  };
}
