import PublishedCaseStories from '@/components/casos/PublishedCaseStories'
import { getPublishedCaseStories } from '@/lib/published-case-stories'

export default async function HomeCaseStories() {
  try {
    const cases = await getPublishedCaseStories(true)
    if (!cases.length) return null
    return <PublishedCaseStories cases={cases} compact />
  } catch {
    return <p role="status" className="px-5 py-3 text-sm">Não foi possível carregar os stories. Tente atualizar a página.</p>
  }
}
