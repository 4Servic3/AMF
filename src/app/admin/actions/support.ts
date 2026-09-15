"use server";
import { adminDb, queryError } from "@/lib/admin-data";
import { requirePermission, writeAdminAuditEvent } from "@/lib/auth/dal";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function replyToTicket(
  ticketId: string,
  content: string,
  isInternal: boolean,
) {
  const session = await requirePermission("support.manage");
  const db = await adminDb("support.manage");
  z.uuid().parse(ticketId);
  const text = z.string().trim().min(1).max(10000).parse(content);
  z.boolean().parse(isInternal);
  const { error } = await db
    .from("support_messages")
    .insert({
      ticket_id: ticketId,
      sender_id: session.user.id,
      content: text,
      is_internal: isInternal,
    });
  queryError(error);
  await writeAdminAuditEvent({
    action: "reply_ticket",
    resourceType: "support_ticket",
    resourceId: ticketId,
    details: { isInternal },
  });
  revalidatePath("/admin/support/" + ticketId);
}
export async function setTicketStatus(ticketId: string, status: string) {
  const db = await adminDb("support.manage");
  z.uuid().parse(ticketId);
  z.enum(["open", "pending", "resolved", "closed"]).parse(status);
  const { data, error } = await db
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId)
    .select("id")
    .single();
  queryError(error);
  await writeAdminAuditEvent({
    action: "ticket_status",
    resourceType: "support_ticket",
    resourceId: data.id,
    details: { status },
  });
  revalidatePath("/admin/support");
  revalidatePath("/admin/support/" + ticketId);
}
