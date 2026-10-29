const DAY = 86_400_000;

export const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento atrasado",
  unpaid: "Não paga",
  canceled: "Cancelada",
};

/** "Vence hoje", "Vence em 5 dias", "Venceu há 2 dias". */
export function dueLabel(periodEnd: string | null | undefined, now: number): string {
  if (!periodEnd) return "Sem data";
  const end = Date.parse(periodEnd);
  if (Number.isNaN(end)) return "Sem data";
  const days = Math.ceil((end - now) / DAY);
  if (days === 0 || (days === 1 && end - now < DAY && new Date(end).toDateString() === new Date(now).toDateString())) return "Vence hoje";
  if (days > 0) return days === 1 ? "Vence amanhã" : `Vence em ${days} dias`;
  const ago = Math.abs(Math.floor((end - now) / DAY));
  return ago <= 1 ? "Venceu ontem" : `Venceu há ${ago} dias`;
}

export function subscriptionCounts(rows: { status: string; current_period_end: string | null }[], now: number) {
  let active = 0, dueSoon = 0, late = 0;
  for (const row of rows) {
    if (row.status === "past_due" || row.status === "unpaid") late++;
    if (row.status !== "active" && row.status !== "trialing") continue;
    active++;
    const end = Date.parse(row.current_period_end || "");
    if (!Number.isNaN(end) && end - now <= 7 * DAY) dueSoon++;
  }
  return { active, dueSoon, late };
}
