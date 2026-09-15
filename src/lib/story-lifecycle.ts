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
