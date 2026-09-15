"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { revalidatePath } from "next/cache";
import { z } from "zod";
const keys = [
  "member_courses_enabled",
  "member_cases_enabled",
  "member_stories_enabled",
  "member_close_friends_enabled",
  "member_home_news_enabled",
  "member_academy_enabled",
] as const;
export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const session = await requirePermission("settings.manage"),
    db = await adminDb("settings.manage");
  z.enum(keys).parse(key);
  z.boolean().parse(enabled);
  const { error } = await db
    .from("feature_flags")
    .upsert(
      {
        key,
        enabled,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  queryError(error);
  await writeAdminAuditEvent({
    action: "update_feature_flag",
    resourceType: "feature_flag",
    details: { key, enabled },
  });
  revalidatePath("/", "layout");
  return { success: true };
}
