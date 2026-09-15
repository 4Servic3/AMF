"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { writeAdminAuditEvent } from "@/lib/auth/dal";
import { revalidatePath } from "next/cache";
import { z } from "zod";
const schema = z.object({
  id: z.uuid().optional(),
  version: z.coerce.number().int().min(1),
  title: z.string().trim().min(1).max(160),
  media_asset_id: z.union([z.uuid(), z.literal("")]),
  cta_target_id: z.string().trim().max(160),
  status: z.enum(["draft", "published", "archived"]),
});
export async function saveHomeBanner(form: FormData) {
  const db = await adminDb("content.manage");
  const value = schema.parse(Object.fromEntries(form));
  if (value.media_asset_id) {
    const { data, error } = await db
      .from("media_assets")
      .select("id,content_type,bucket")
      .eq("id", value.media_asset_id)
      .single();
    queryError(error);
    if (!data.bucket || !data.content_type.startsWith("image/"))
      throw new Error("Selecione uma imagem da biblioteca.");
  }
  if (value.cta_target_id) {
    const { data, error } = await db
      .from("courses")
      .select("slug")
      .eq("slug", value.cta_target_id)
      .maybeSingle();
    queryError(error);
    if (!data) throw new Error("Curso de destino inválido.");
  }
  const { data: section, error: sectionError } = await db
    .from("home_sections")
    .upsert(
      { key: "hero", title: "Banner principal", status: "published" },
      { onConflict: "key" },
    )
    .select("id")
    .single();
  queryError(sectionError);
  const payload = {
    title: value.title,
    media_asset_id: value.media_asset_id || null,
    cta_target_type: "course",
    cta_target_id: value.cta_target_id || null,
    status: value.status,
    section_id: section.id,
    version: value.version + 1,
  };
  let result;
  if (value.id)
    result = await db
      .from("home_banners")
      .update(payload)
      .eq("id", value.id)
      .eq("version", value.version)
      .select("id")
      .maybeSingle();
  else
    result = await db
      .from("home_banners")
      .insert({ ...payload, version: 1 })
      .select("id")
      .single();
  queryError(result.error);
  if (!result.data)
    throw new Error(
      "Este banner foi alterado por outra pessoa. Recarregue antes de salvar.",
    );
  await writeAdminAuditEvent({
    action: "save_banner",
    resourceType: "home_banner",
    resourceId: result.data.id,
  });
  revalidatePath("/admin/home");
  revalidatePath("/app");
}
