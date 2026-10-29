import { accessStatus } from "@/lib/admin-values";

export type AccessRow = {
  resource_type: string;
  resource_id: string;
  source_type: string | null;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  profile?: { full_name?: string | null; email?: string | null } | null;
};

export type AccessFilters = { q?: string; recurso?: string; situacao?: string; origem?: string };

export const ORIGIN_LABEL: Record<string, string> = {
  manual: "Manual (admin)",
  purchase: "Compra",
  subscription: "Assinatura",
};

export const SITUATION_OPTIONS = [
  { value: "ativos", label: "Ativos" },
  { value: "vencendo", label: "Vencem em 30 dias" },
  { value: "expirados", label: "Expirados" },
  { value: "revogados", label: "Revogados" },
] as const;

const DAY = 86_400_000;

/** Ativo e com prazo terminando nos próximos 30 dias. */
export function expiresSoon(row: AccessRow, now: number) {
  if (accessStatus(row, now) !== "Ativo" || !row.expires_at) return false;
  return Date.parse(row.expires_at) - now <= 30 * DAY;
}

function matchesSituation(row: AccessRow, situation: string, now: number) {
  const status = accessStatus(row, now);
  if (situation === "ativos") return status === "Ativo";
  if (situation === "vencendo") return expiresSoon(row, now);
  if (situation === "expirados") return status === "Expirado";
  if (situation === "revogados") return status === "Revogado";
  return true;
}

/** Filtros da tela "Quem tem acesso". `recurso` é "course:<id>" ou "product:<id>". */
export function filterAccess<T extends AccessRow>(rows: T[], filters: AccessFilters, now: number): T[] {
  const q = filters.q?.trim().toLowerCase();
  const [kind, id] = (filters.recurso || "").split(":");
  return rows.filter((row) => {
    if (q && !`${row.profile?.full_name || ""} ${row.profile?.email || ""}`.toLowerCase().includes(q)) return false;
    if (kind && id && (row.resource_type !== kind || row.resource_id !== id)) return false;
    if (filters.origem && row.source_type !== filters.origem) return false;
    if (filters.situacao && !matchesSituation(row, filters.situacao, now)) return false;
    return true;
  });
}

export function accessCounts(rows: AccessRow[], now: number) {
  let active = 0, soon = 0, manual = 0, paid = 0;
  for (const row of rows) {
    if (accessStatus(row, now) !== "Ativo") continue;
    active++;
    if (expiresSoon(row, now)) soon++;
    if (row.source_type === "manual") manual++;
    else paid++;
  }
  return { active, soon, manual, paid };
}
