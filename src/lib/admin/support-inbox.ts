export type InboxTicket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  profile_id: string;
  profiles?: { full_name: string | null; email: string | null } | null;
  support_messages?: { sender_id: string | null; is_internal: boolean; created_at: string }[] | null;
};

export type InboxItem = { id: string; subject: string; student: string; isNew: boolean; at: string };

/** Situações em que o chamado ainda pode precisar da equipe. */
export const ACTIVE_TICKET_STATUSES = ["open", "pending", "in_progress", "waiting_user"];

/**
 * Chamados esperando a equipe: a última mensagem visível foi do aluno.
 * "Novo" quando a equipe ainda não respondeu nenhuma vez.
 */
export function awaitingReply(tickets: InboxTicket[]): InboxItem[] {
  return tickets
    .map((t) => {
      const visible = (t.support_messages || []).filter((m) => !m.is_internal).sort((a, b) => a.created_at.localeCompare(b.created_at));
      const last = visible.at(-1);
      if (last && last.sender_id !== t.profile_id) return null;
      return {
        id: t.id,
        subject: t.subject,
        student: t.profiles?.full_name || t.profiles?.email || "Aluno",
        isNew: !visible.some((m) => m.sender_id !== t.profile_id),
        at: last?.created_at || t.created_at,
      };
    })
    .filter((t): t is InboxItem => !!t)
    .sort((a, b) => b.at.localeCompare(a.at));
}
