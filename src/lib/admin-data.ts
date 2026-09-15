import "server-only";
import { requirePermission } from "@/lib/auth/dal";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
export async function adminDb(permission: string) {
  await requirePermission(permission);
  return createServiceRoleClient();
}
export function queryError(error: unknown) {
  if (error) {
    console.error("Admin database query failed", error);
    throw new Error(
      "Não foi possível consultar os dados. Verifique a configuração desta área.",
    );
  }
}
export async function allRows(
  db: any,
  table: string,
  columns: string,
  configure: (query: any) => any = (q) => q,
) {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await configure(db.from(table).select(columns))
      .order("id")
      .range(offset, offset + 499);
    queryError(error);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
