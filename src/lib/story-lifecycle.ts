export const STORY_HOME_LIFETIME_MS = 48 * 60 * 60 * 1000
export function storyIsRecent(publishedAt: string | null | undefined, now = Date.now()) {
  if (!publishedAt) return false
  const published = Date.parse(publishedAt)
  return Number.isFinite(published) && published <= now && published + STORY_HOME_LIFETIME_MS > now
}
export function portraitContain(width: number, height: number) {
  if (!(width > 0 && height > 0)) throw new Error('Dimensões inválidas.')
  const scale = Math.min(720 / width, 1280 / height)
  return { x: (720-width*scale)/2, y: (1280-height*scale)/2, width: width*scale, height: height*scale }
}

/**
 * Nova ordem dos stories de um caso. A ordem no app segue created_at, então
 * redistribuímos os mesmos horários na sequência pedida (sem mudar o esquema).
 * Retorna só as linhas que mudam; null se a lista não bate com o caso.
 */
export function reorderedTimestamps(rows: { id: string; created_at: string }[], orderedIds: string[]) {
  if (orderedIds.length !== rows.length || new Set(orderedIds).size !== rows.length) return null
  const byId = new Map(rows.map(row => [row.id, row]))
  if (orderedIds.some(id => !byId.has(id))) return null
  const times = rows.map(row => Date.parse(row.created_at)).sort((a, b) => a - b)
  for (let i = 1; i < times.length; i++) if (times[i] <= times[i - 1]) times[i] = times[i - 1] + 1
  return orderedIds
    .map((id, i) => ({ id, created_at: new Date(times[i]).toISOString() }))
    .filter(change => Date.parse(byId.get(change.id)!.created_at) !== Date.parse(change.created_at))
}
