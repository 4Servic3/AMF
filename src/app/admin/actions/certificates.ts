"use server";
import { adminDb } from "@/lib/admin-data";
import { revalidatePath } from "next/cache";

import {
  requireAal2,
  requirePermission,
  writeAdminAuditEvent,
} from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export async function revokeCertificate(
  validationCode: string,
  reason: string,
) {
  if (!reason.trim()) throw new Error("Informe o motivo da revogação.");
  const session = await requireAal2();
  await requirePermission("academy.manage");
  const supabase = await adminDb("academy.manage");

  const { data: cert, error: fetchError } = await supabase
    .from("certificates")
    .select("id, status")
    .eq("validation_code", validationCode)
    .single();

  if (fetchError || !cert) {
    throw new Error("Certificate not found");
  }

  if (cert.status === "revoked") {
    throw new Error("Certificate is already revoked");
  }

  const { error } = await supabase
    .from("certificates")
    .update({
      status: "revoked",
      revoked_by: session.user.id,
      revoked_reason: reason,
      revoked_at: new Date().toISOString(),
    })
    .eq("validation_code", validationCode);

  if (error) {
    throw new Error("Failed to revoke certificate: " + error.message);
  }

  await writeAdminAuditEvent({
    action: "revoke",
    resourceType: "certificates",
    resourceId: cert.id,
    reason: reason,
  });

  revalidatePath("/admin/certificates");
  return { success: true };
}
