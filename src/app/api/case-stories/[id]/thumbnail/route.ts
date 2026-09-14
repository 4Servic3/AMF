import { getCaseStoryPlayback } from '@/app/app/casos/actions'

// Reuse the same authentication, publication and visibility checks as the player.
// Never cache a signed redirect: each new request must check access again.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' }
  try {
    const { id } = await params
    const media = await getCaseStoryPlayback(id)
    if (media.error) return new Response(null, { status: 404, headers })
    let url = media.imageUrl
    if (!url && media.playbackId && media.tokens?.thumbnail) {
      url = 'https://image.mux.com/' + encodeURIComponent(media.playbackId) + '/thumbnail.jpg?token=' + encodeURIComponent(media.tokens.thumbnail)
    }
    if (!url) return new Response(null, { status: 404, headers })
    return new Response(null, { status: 307, headers: { ...headers, Location: url } })
  } catch {
    return new Response(null, { status: 503, headers })
  }
}
