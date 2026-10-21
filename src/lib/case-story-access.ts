/** Sem o produto de casos, apenas o primeiro story publicado de cada caso pode ser reproduzido. */
export function canPlayCaseStory(hasFullAccess: boolean, storyId: string, firstStoryId: string | null | undefined) {
  return hasFullAccess || (!!firstStoryId && storyId === firstStoryId)
}
