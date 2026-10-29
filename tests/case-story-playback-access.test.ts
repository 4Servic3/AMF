import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ user: vi.fn(), flags: vi.fn(), rpc: vi.fn(), serviceFrom: vi.fn(), select: vi.fn(), eq: vi.fn(), in: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(), tokens: vi.fn(), lte: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.user }, rpc: mocks.rpc }) }))
vi.mock('@/lib/supabase/service-role', () => ({ createServiceRoleClient: () => ({ from: mocks.serviceFrom }) }))
vi.mock('@/lib/services/flags', () => ({ getFeatureFlags: mocks.flags }))
vi.mock('@/lib/mux/client', () => ({ generatePlaybackSessionTokens: mocks.tokens }))

import { getCaseStoryPlayback } from '@/app/app/casos/actions'

const storyId = '11111111-1111-4111-8111-111111111111'
beforeEach(() => {
  vi.resetAllMocks()
  mocks.user.mockResolvedValue({ data: { user: { id: 'member' } } })
  mocks.flags.mockResolvedValue({ member_cases_enabled: true })
  mocks.rpc.mockResolvedValue({ data: { courses: [], products: [], cases: false }, error: null })
  const storyQuery = { select: mocks.select, eq: mocks.eq, in: mocks.in, order: mocks.order, limit: mocks.limit, maybeSingle: mocks.maybeSingle, lte: mocks.lte }
  mocks.serviceFrom.mockReturnValue(storyQuery)
  mocks.select.mockReturnValue(storyQuery); mocks.eq.mockReturnValue(storyQuery); mocks.in.mockReturnValue(storyQuery); mocks.order.mockReturnValue(storyQuery); mocks.limit.mockReturnValue(storyQuery); mocks.lte.mockReturnValue(storyQuery)
  mocks.maybeSingle.mockResolvedValueOnce({ data: { id: storyId, case_id: 'case', mux_playback_id: 'mux', duration_seconds: 10, media_type: 'video', storage_path: null, cases: { status: 'published', visibility: 'authenticated' } }, error: null })
    .mockResolvedValueOnce({ data: { id: 'first-story' }, error: null })
})

it('rejects playback of a later story without the cases product at the server action', async () => {
  expect(await getCaseStoryPlayback(storyId)).toMatchObject({ error: expect.stringContaining('acesso completo') })
  expect(mocks.tokens).not.toHaveBeenCalled()
})

it('signs playback of a later story for a member with cases access', async () => {
  mocks.rpc.mockResolvedValue({ data: { courses: [], products: [], cases: true }, error: null })
  mocks.tokens.mockResolvedValue({ tokens: { playback: 'p', thumbnail: 't', storyboard: 's' } })
  expect(await getCaseStoryPlayback(storyId)).toMatchObject({ playbackId: 'mux' })
})

it('fails closed when access cannot be verified', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'offline' } })
  expect(await getCaseStoryPlayback(storyId)).toMatchObject({ error: expect.stringContaining('verificar') })
  expect(mocks.tokens).not.toHaveBeenCalled()
})
