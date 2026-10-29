import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ results: [] as unknown[], or: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: () => {
      const result = mocks.results.shift()
      const query: Record<string, unknown> = {}
      for (const k of ['select', 'eq', 'order']) query[k] = () => query
      query.or = (...args: unknown[]) => { mocks.or(...args); return query }
      query.limit = () => query
      query.then = (resolve: (v: unknown) => unknown) => resolve(result)
      return query
    },
  }),
}))

import { loadLiveHomeBanners } from '@/lib/home-banners'

beforeEach(() => { mocks.results = []; mocks.or.mockReset() })

it('asks only for banners inside their start and end dates', async () => {
  mocks.results.push({ data: [{ id: 'b1' }], error: null })
  expect(await loadLiveHomeBanners()).toEqual([{ id: 'b1' }])
  expect(mocks.or).toHaveBeenCalledWith(expect.stringMatching(/^starts_at\.is\.null,starts_at\.lte\./))
  expect(mocks.or).toHaveBeenCalledWith(expect.stringMatching(/^ends_at\.is\.null,ends_at\.gt\./))
})

it('falls back to every published banner before the date columns exist', async () => {
  mocks.results.push({ data: null, error: { code: '42703' } }, { data: [{ id: 'b2' }], error: null })
  expect(await loadLiveHomeBanners()).toEqual([{ id: 'b2' }])
})

it('shows the default image when the query fails for another reason', async () => {
  mocks.results.push({ data: null, error: { code: '500' } })
  expect(await loadLiveHomeBanners()).toEqual([])
})
