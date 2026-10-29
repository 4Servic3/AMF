import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ user: vi.fn(), rpc: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.user }, rpc: mocks.rpc }) }))

import { getMemberAccess } from '@/lib/access/member-access'

const course = '918c176f-8d14-43a9-89e9-67aa43820a9d'
const product = 'f6748b06-8efa-4dc6-a28f-96a17d14b7fd'

describe('member access (single source for courses, products and cases)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.user.mockResolvedValue({ data: { user: { id: 'member' } }, error: null })
  })

  it('does not ask the database about anonymous visitors', async () => {
    mocks.user.mockResolvedValue({ data: { user: null }, error: null })
    const access = await getMemberAccess()
    expect(access).toMatchObject({ state: 'anonymous', userId: null, hasCasesAccess: false })
    expect(access.courseIds.size).toBe(0)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('exposes exactly what the database summary grants', async () => {
    mocks.rpc.mockResolvedValue({ data: { courses: [course], products: [product], cases: true }, error: null })
    const access = await getMemberAccess()
    expect(mocks.rpc).toHaveBeenCalledWith('member_access_summary')
    expect(access.state).toBe('ready')
    expect(access.courseIds.has(course)).toBe(true)
    expect(access.productIds.has(product)).toBe(true)
    expect(access.hasCasesAccess).toBe(true)
  })

  it('grants nothing when the summary call fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'timeout' } })
    expect(await getMemberAccess()).toMatchObject({ state: 'unavailable', userId: 'member', hasCasesAccess: false })
  })

  it.each([
    ['missing cases flag', { courses: [], products: [] }],
    ['cases as a string', { courses: [], products: [], cases: 'true' }],
    ['non-uuid course id', { courses: ['../admin'], products: [], cases: false }],
    ['products not a list', { courses: [], products: product, cases: false }],
  ])('grants nothing for a malformed summary (%s)', async (_label, data) => {
    mocks.rpc.mockResolvedValue({ data, error: null })
    const access = await getMemberAccess()
    expect(access.state).toBe('unavailable')
    expect(access.courseIds.size + access.productIds.size).toBe(0)
    expect(access.hasCasesAccess).toBe(false)
  })

  it('grants nothing when the auth client throws', async () => {
    mocks.user.mockRejectedValue(new Error('network'))
    expect(await getMemberAccess()).toMatchObject({ state: 'unavailable', hasCasesAccess: false })
  })
})
