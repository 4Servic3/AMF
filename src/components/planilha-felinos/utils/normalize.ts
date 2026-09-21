export function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesSearch(query: string, ...fields: string[]): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  return fields.some(f => normalizeText(f).includes(q));
}
