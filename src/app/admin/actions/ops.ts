"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { writeAdminAuditEvent } from "@/lib/auth/dal";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function reprocessWebhook(webhookId: string) {
  const db = await adminDb("ops.manage");
  z.uuid().parse(webhookId);
  const { data, error } = await db
    .from("webhook_events")
    .update({
      status: "pending",
      processing_status: "pending",
      last_error: null,
    })
    .eq("id", webhookId)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();
  queryError(error);
  if (!data) throw new Error("Somente eventos com falha podem voltar à fila.");
  await writeAdminAuditEvent({
    action: "requeue_webhook",
    resourceType: "webhook",
    resourceId: data.id,
  });
  revalidatePath("/admin/operations");
}
export async function requeueJob(jobId: string) {
  const db = await adminDb("ops.manage");
  z.uuid().parse(jobId);
  const { data, error } = await db
    .from("background_jobs")
    .update({
      status: "pending",
      attempts: 0,
      locked_at: null,
      locked_by_worker: null,
      last_error: null,
      run_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();
  queryError(error);
  if (!data) throw new Error("Somente tarefas com falha podem voltar à fila.");
  await writeAdminAuditEvent({
    action: "requeue_job",
    resourceType: "job",
    resourceId: data.id,
  });
  revalidatePath("/admin/operations");
}
