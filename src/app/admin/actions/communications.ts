"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** Mesmo critério do lado do aluno: só links internos da área de membros. */
const appLink = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || (/^\/app(?:\/|$|\?)/.test(v) && !/[\\\x00-\x20]/.test(v)), "O link precisa começar com /app.");

const noticeSchema = z.object({
  name: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(2000),
  target_url: appLink.optional().default(""),
});

/**
 * Publica um aviso no aplicativo para todos os alunos. Registra a campanha (histórico
 * e auditoria) e cria a notificação que a tela de notificações do aluno lê.
 */
export async function publishInAppNotice(form: FormData) {
  const session = await requirePermission("communications.manage"),
    db = await adminDb("communications.manage");
  const value = noticeSchema.parse(Object.fromEntries(form));
  const template = await db
    .from("notification_templates")
    .insert({ key: crypto.randomUUID(), channel: "in_app", subject: value.name, body: value.body, status: "active" })
    .select("id")
    .single();
  queryError(template.error);
  const campaign = await db
    .from("notification_campaigns")
    .insert({
      name: value.name,
      template_id: template.data.id,
      channels: ["in_app"],
      audience_definition: { segment: "all" },
      status: "sending",
      created_by: session.user.id,
      approved_by: session.user.id,
    })
    .select("id")
    .single();
  if (campaign.error) {
    await db.from("notification_templates").delete().eq("id", template.data.id);
    queryError(campaign.error);
  }
  const notice = await db.from("notifications").insert({
    title: value.name,
    message: value.body,
    type: "campaign",
    target_url: value.target_url || null,
  });
  await db
    .from("notification_campaigns")
    .update({ status: notice.error ? "failed" : "completed" })
    .eq("id", campaign.data.id);
  queryError(notice.error);
  await writeAdminAuditEvent({
    action: "publish_in_app_notice",
    resourceType: "campaign",
    resourceId: campaign.data.id,
  });
  revalidatePath("/admin/communications");
  revalidatePath("/app/notificacoes");
}
