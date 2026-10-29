import "server-only";

/** Lugares do app que apontam para um arquivo da biblioteca. */
const SOURCES = [
  { table: "home_banners", columns: ["media_asset_id"], label: (r: Row) => `Banner da home${r.title ? `: ${r.title}` : ""}`, select: "title" },
  { table: "courses", columns: ["cover_asset_id", "banner_asset_id"], label: (r: Row) => `Capa do curso ${r.title || ""}`.trim(), select: "title" },
  { table: "lesson_materials", columns: ["media_asset_id"], label: (r: Row) => `Material de aula${r.title ? `: ${r.title}` : ""}`, select: "title" },
  { table: "cases", columns: ["cover_asset_id", "hero_asset_id"], label: (r: Row) => `Caso ${r.title || ""}`.trim(), select: "title" },
] as const;

type Row = Record<string, string | null>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export type MediaUsage = { uses: Map<string, string[]>; complete: boolean };

/**
 * Onde cada arquivo é usado. Se alguma consulta falhar (coluna antiga ausente,
 * por exemplo), `complete` fica falso e a exclusão deve continuar bloqueada.
 */
export async function loadMediaUsage(db: Db, ids: string[]): Promise<MediaUsage> {
  const uses = new Map<string, string[]>();
  if (!ids.length) return { uses, complete: true };
  let complete = true;
  const queries = SOURCES.flatMap((source) =>
    source.columns.map(async (column) => {
      const { data, error } = await db.from(source.table).select(`${column},${source.select}`).in(column, ids);
      if (error) { complete = false; return; }
      for (const row of (data || []) as Row[]) {
        const id = row[column];
        if (!id) continue;
        const list = uses.get(id) || [];
        list.push(source.label(row));
        uses.set(id, list);
      }
    }),
  );
  await Promise.all(queries);
  return { uses, complete };
}
