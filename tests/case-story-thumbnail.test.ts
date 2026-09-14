import { beforeEach, describe, expect, it, vi } from 'vitest'
const playback = vi.hoisted(() => vi.fn())
vi.mock('@/app/app/casos/actions', () => ({ getCaseStoryPlayback: playback }))
import { GET } from '@/app/api/case-stories/[id]/thumbnail/route'
const request = () => GET(new Request('https://amf.test/api/case-stories/story/thumbnail'), { params: Promise.resolve({id:'story'}) })
describe('protected story covers', () => {
  beforeEach(() => vi.resetAllMocks())
  it('redirects photos to their signed image with no shared cache', async () => {
    playback.mockResolvedValue({ imageUrl:'https://storage.test/signed-photo' })
    const response = await request()
    expect(playback).toHaveBeenCalledWith('story')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://storage.test/signed-photo')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('vary')).toBe('Cookie')
  })
  it('uses only the thumbnail token for a video cover', async () => {
    playback.mockResolvedValue({ playbackId:'video', tokens:{thumbnail:'image-token',playback:'video-token'} })
    const response = await request()
    expect(response.headers.get('location')).toBe('https://image.mux.com/video/thumbnail.jpg?token=image-token')
  })
  it('does not expose covers when playback denies access or content is unpublished', async () => {
    playback.mockResolvedValue({error:'Este story não está disponível.'})
    const response = await request()
    expect(response.status).toBe(404)
    expect(response.headers.has('location')).toBe(false)
  })
  it('never falls back to unsigned video images', async () => {
    playback.mockResolvedValue({playbackId:'video'})
    expect((await request()).status).toBe(404)
  })
  it('fails safely when the media service is unavailable', async () => {
    playback.mockRejectedValue(new Error('offline'))
    expect((await request()).status).toBe(503)
  })
})
