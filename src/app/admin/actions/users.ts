"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { grantCourseAccess, revokeCourseAccess } from "./courses";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseAccessTarget } from "@/lib/admin-access-target";
import { randomBytes, randomUUID } from "node:crypto";

const newMemberSchema = z.object({
  fullName: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().max(254).optional().default(""),
  password: z.string().max(128).optional().default(""),
  temporary: z.boolean().default(false),
  courseId: z.string().uuid().optional().nullable(),
  courseIds: z.array(z.string().uuid()).max(50).optional().default([]),
  productIds: z.array(z.string().uuid()).max(50).optional().default([]),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
}).strict();

export async function createMemberTestUser(input: unknown) {
  const session = await requirePermission("users.manage");
  const db = await adminDb("users.manage");
  const parsed = newMemberSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Confira o nome, e-mail e senha informados." };
  const values = parsed.data;
  const temporary = values.temporary;
  const email = temporary ? `teste-${randomUUID()}@example.invalid` : values.email.toLowerCase();
  if (!temporary && !values.fullName.trim()) return { success: false as const, error: "Informe o nome do aluno." };
  if (!temporary && !z.string().email().safeParse(email).success) return { success: false as const, error: "Informe um e-mail válido." };
  const password = temporary || !values.password
    ? `AMF-${randomBytes(24).toString("base64url")}!a9`
    : values.password;
  if (!temporary && values.password && values.password.length < 12)
    return { success: false as const, error: "Use uma senha com pelo menos 12 caracteres." };
  let fullName = temporary ? "Conta de teste AMF" : values.fullName.trim();
  const courseIds = [...new Set([...(values.courseId ? [values.courseId] : []), ...values.courseIds])];
  const productIds = [...new Set(values.productIds)];
  // Fim do dia escolhido, no horário de Brasília, vale para todos os acessos liberados.
  const expires = values.expiresAt ? new Date(`${values.expiresAt}T23:59:59-03:00`) : null;
  if (expires && (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()))
    return { success: false as const, error: "Escolha uma data de expiração futura." };
  for (const courseId of courseIds) {
    const { data: course, error } = await db.from("courses").select("id").eq("id", courseId).eq("status", "published").maybeSingle();
    if (error || !course) return { success: false as const, error: "O curso escolhido não está publicado ou não está disponível." };
  }
  for (const productId of productIds) {
    const { data: product, error } = await db.from("products").select("id").eq("id", productId).eq("status", "active").neq("type", "course").maybeSingle();
    if (error || !product) return { success: false as const, error: "O produto escolhido não está ativo ou não está disponível." };
  }
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, first_name: fullName.split(/\s+/)[0] },
  });
  if (createError || !created.user) return { success: false as const, error: "Não foi possível criar a conta. Verifique se o e-mail já está cadastrado." };
  const userId = created.user.id;
  const { error: profileError } = await db.from("profiles").insert({ id: userId, full_name: fullName, email, role: "member" });
  if (profileError) {
    await db.auth.admin.deleteUser(userId);
    return { success: false as const, error: "A conta não foi concluída porque o perfil não pôde ser criado." };
  }
  for (const courseId of courseIds) {
    const { error } = await db.rpc("course_access_admin", {
      p_course: courseId, p_actor: session.user.id, p_email: email, p_expires: expires?.toISOString() ?? null,
    });
    if (error) {
      await db.auth.admin.deleteUser(userId);
      return { success: false as const, error: "A conta não foi concluída porque o acesso ao curso falhou." };
    }
  }
  for (const productId of productIds) {
    const { error } = await db.rpc("product_access_admin", {
      p_product: productId, p_actor: session.user.id, p_profile: userId, p_expires: expires?.toISOString() ?? null,
      p_reason: "Liberado na criação do usuário",
    });
    if (error) {
      await db.auth.admin.deleteUser(userId);
      return { success: false as const, error: "A conta não foi concluída porque o acesso ao produto falhou." };
    }
  }
  await writeAdminAuditEvent({
    action: "create_member_test_user",
    resourceType: "profile",
    resourceId: userId,
    details: { temporary, course_ids: courseIds, product_ids: productIds, expires_at: expires?.toISOString() ?? null },
  });
  revalidatePath("/admin/users");
  revalidatePath("/app/cursos", "layout");
  revalidatePath("/app");
  return { success: true as const, userId, email, password, temporary, fullName };
}
export async function grantManualAccess(
  userId: string,
  target: string,
  reason: string,
) {
  const session = await requirePermission("users.manage");
  const db = await adminDb("users.manage");
  z.uuid().parse(userId);
  const why = z.string().trim().min(3).max(500).parse(reason);
  const parsed = parseAccessTarget(target);
  if (!parsed) throw new Error("Escolha um curso ou produto válido.");
  if (parsed.kind === "course") {
    const { data, error } = await db
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();
    queryError(error);
    const result = await grantCourseAccess(parsed.id, data.email, null);
    if (!result.success) throw new Error(result.error);
  } else {
    const { error } = await db.rpc("product_access_admin", {
      p_product: parsed.id, p_actor: session.user.id, p_profile: userId, p_reason: why,
    });
    if (error) throw new Error(error.code === "P0001" ? error.message : "Não foi possível conceder o acesso.");
  }
  await writeAdminAuditEvent({
    action: "grant_access",
    resourceType: "profile",
    resourceId: userId,
    reason: why,
    details: { target: parsed },
  });
  revalidatePath("/admin/users/" + userId);
  revalidatePath("/admin/access");
}
export async function revokeAccess(
  userId: string,
  entitlementId: string,
  reason: string,
) {
  const session = await requirePermission("users.manage");
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
    const result = await db.rpc("product_access_admin", {
      p_product: data.resource_id, p_actor: session.user.id, p_revoke: entitlementId, p_reason: reason,
    });
    if (result.error) throw new Error(result.error.code === "P0001" ? result.error.message : "Não foi possível revogar o acesso.");
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
