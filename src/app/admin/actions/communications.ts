"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function createCampaign(form: FormData) {
  const session = await requirePermission("communications.manage"),
    db = await adminDb("communications.manage");
  const value = z
    .object({
      name: z.string().trim().min(1).max(160),
      body: z.string().trim().min(1).max(10000),
      audience: z.enum(["all", "active", "inactive"]),
      channel: z.enum(["in_app", "email"]),
    })
    .parse(Object.fromEntries(form));
  const template = await db
    .from("notification_templates")
    .insert({
      key: crypto.randomUUID(),
      channel: value.channel,
      subject: value.name,
      body: value.body,
      status: "draft",
    })
    .select("id")
    .single();
  queryError(template.error);
  const campaign = await db
    .from("notification_campaigns")
    .insert({
      name: value.name,
      template_id: template.data.id,
      channels: [value.channel],
      audience_definition: { segment: value.audience },
      status: "draft",
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (campaign.error) {
    await db.from("notification_templates").delete().eq("id", template.data.id);
    queryError(campaign.error);
  }
  await writeAdminAuditEvent({
    action: "create_campaign_draft",
    resourceType: "campaign",
    resourceId: campaign.data.id,
  });
  revalidatePath("/admin/communications");
}
