import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: vi.fn(), flags: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), in: vi.fn(), order: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.user } }) }))
vi.mock('@/lib/services/flags', () => ({ getFeatureFlags: mocks.flags }))
vi.mock('@/lib/supabase/service-role', () => ({ createServiceRoleClient: () => ({ from: mocks.from }) }))
import { getPublishedCaseStories } from '@/lib/published-case-stories'
describe('published stories for all signed-in users', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    const query = { select: mocks.select, eq: mocks.eq, in: mocks.in, order: mocks.order }
    mocks.from.mockReturnValue(query); mocks.select.mockReturnValue(query); mocks.eq.mockReturnValue(query); mocks.in.mockReturnValue(query)
    mocks.user.mockResolvedValue({ data: { user: { id: 'user-without-purchases' } } })
    mocks.flags.mockResolvedValue({ member_cases_enabled: true })
  })
  it('never queries private content without authentication', async () => {
    mocks.user.mockResolvedValue({ data: { user: null } })
    expect(await getPublishedCaseStories()).toEqual([])
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('honors the feature switch', async () => {
    mocks.flags.mockResolvedValue({ member_cases_enabled: false })
    expect(await getPublishedCaseStories()).toEqual([])
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('allows a user without purchases and returns only display metadata in story order', async () => {
    mocks.order.mockResolvedValue({ data: [{ id: 'case', title: 'Caso', case_story_videos: [
      { id: 'b', caption: 'Segundo', created_at: '2026-09-14', status: 'published' },
      { id: 'a', caption: null, created_at: '2026-09-13', status: 'published' }
    ] }], error: null })
    expect(await getPublishedCaseStories()).toEqual([{ id: 'case', title: 'Caso', items: [{ id: 'a', caption: '' }, { id: 'b', caption: 'Segundo' }] }])
    expect(mocks.eq).toHaveBeenCalledWith('status', 'published')
    expect(mocks.eq).toHaveBeenCalledWith('case_story_videos.status', 'published')
    expect(mocks.in).toHaveBeenCalledWith('visibility', ['free', 'authenticated'])
    expect(mocks.from).toHaveBeenCalledTimes(1)
  })
  it('home excludes expired stories while the archive preserves them', async () => {
    const published_at = new Date(Date.now()-49*3600000).toISOString()
    const recent = new Date(Date.now()-3600000).toISOString()
    mocks.order.mockResolvedValue({ data: [{ id: 'case', title: 'Caso', case_story_videos: [
      {id:'old',caption:'Antigo',created_at:published_at,published_at,status:'published'},
      {id:'new',caption:'Novo',created_at:recent,published_at:recent,status:'published'}
    ]}],error:null })
    expect((await getPublishedCaseStories(true))[0].items.map(s=>s.id)).toEqual(['new'])
    expect((await getPublishedCaseStories())[0].items.map(s=>s.id)).toEqual(['old','new'])
  })
  it('removes cases with only expired stories from home', async () => {
    mocks.order.mockResolvedValue({data:[{id:'case',title:'Caso',case_story_videos:[{id:'old',caption:'',created_at:'2020-01-01',published_at:'2020-01-01',status:'published'}]}],error:null})
    expect(await getPublishedCaseStories(true)).toEqual([])
  })
  it('surfaces database failures instead of treating them as an empty feed', async () => {
    mocks.order.mockResolvedValue({ error: { message: 'offline' }, data: null })
    await expect(getPublishedCaseStories()).rejects.toThrow('Não foi possível carregar os casos.')
  })
})
