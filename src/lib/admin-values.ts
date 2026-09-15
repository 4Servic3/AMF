export function accessStatus(
  item: {
    status?: string;
    starts_at?: string | null;
    expires_at?: string | null;
  },
  now = Date.now(),
) {
  if (item.status === "revoked") return "Revogado";
  if (
    item.status === "expired" ||
    (item.expires_at && Date.parse(item.expires_at) <= now)
  )
    return "Expirado";
  if (item.starts_at && Date.parse(item.starts_at) > now) return "Agendado";
  return item.status === "active" ? "Ativo" : "Pendente";
}
export function csvCell(value: unknown) {
  let text =
    typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function bannerHref(type: string | null, target: string | null) {
  if (!target) return undefined;
  const routes: Record<string, string> = {
    course: "/app/cursos/",
    case: "/app/casos/",
  };
  return type && routes[type]
    ? routes[type] + encodeURIComponent(target)
    : undefined;
}
