"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "@/lib/admin-data";
import { writeAdminAuditEvent } from "@/lib/auth/dal";
import { loadMediaUsage } from "@/lib/admin/media-usage";

/** Exclui um arquivo da biblioteca só quando nada no app aponta para ele. */
export async function deleteMediaAsset(id: string) {
  const db = await adminDb("media.manage");
  if (!z.string().uuid().safeParse(id).success) return { error: "Arquivo inválido." };
  const { data: asset, error } = await db.from("media_assets").select("id,bucket,file_path").eq("id", id).maybeSingle();
  if (error || !asset) return { error: "Arquivo não encontrado." };
  const usage = await loadMediaUsage(db, [id]);
  if (!usage.complete) return { error: "Não foi possível conferir onde o arquivo é usado. Nada foi excluído." };
  const uses = usage.uses.get(id);
  if (uses?.length) return { error: `Este arquivo está em uso (${uses.join(", ")}). Troque antes de excluir.` };
  // Apaga o registro primeiro: as referências do banco bloqueiam se algo ainda usar o arquivo.
  const removed = await db.from("media_assets").delete().eq("id", id);
  if (removed.error) return { error: "O banco recusou a exclusão porque o arquivo ainda está em uso." };
  if (asset.bucket && asset.file_path) await db.storage.from(asset.bucket).remove([asset.file_path]);
  await writeAdminAuditEvent({ action: "delete_media", resourceType: "media", resourceId: id });
  revalidatePath("/admin/media");
  return { success: true as const };
}
