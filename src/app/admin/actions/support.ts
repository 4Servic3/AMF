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
  if (!isInternal) await notifyMemberOfReply(db, ticketId, text);
  await writeAdminAuditEvent({
    action: "reply_ticket",
    resourceType: "support_ticket",
    resourceId: ticketId,
    details: { isInternal },
  });
  revalidatePath("/admin/support/" + ticketId);
  revalidatePath("/admin/support");
}
/**
 * Avisa o aluno no sino do app; o aviso leva direto para a conversa.
 * Só grava com profile_id: sem a coluna no banco, não envia nada (nunca vira aviso para todos).
 */
async function notifyMemberOfReply(db: Awaited<ReturnType<typeof adminDb>>, ticketId: string, text: string) {
  const { data: ticket } = await db.from("support_tickets").select("profile_id,subject").eq("id", ticketId).maybeSingle();
  if (!ticket?.profile_id) return;
  const preview = text.replace(/\s+/g, " ").slice(0, 140);
  const { error } = await db.from("notifications").insert({
    profile_id: ticket.profile_id,
    title: "Resposta do suporte",
    message: `${ticket.subject}: ${preview}${text.length > 140 ? "…" : ""}`,
    type: "support_reply",
    target_url: `/app/perfil/suporte/${ticketId}`,
  });
  if (error) console.error("Support reply notification failed", error);
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
