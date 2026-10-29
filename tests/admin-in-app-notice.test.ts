import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ permission: vi.fn(), adminDb: vi.fn(), audit: vi.fn(), inserts: [] as { table: string; row: Record<string, unknown> }[], updates: [] as Record<string, unknown>[], noticeError: null as unknown }))
vi.mock('@/lib/auth/dal', () => ({ requirePermission: mocks.permission, writeAdminAuditEvent: mocks.audit }))
vi.mock('@/lib/admin-data', () => ({ adminDb: mocks.adminDb, queryError: (error: unknown) => { if (error) throw new Error('query') } }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { publishInAppNotice } from '@/app/admin/actions/communications'

function table(name: string) {
  return {
    insert: (row: Record<string, unknown>) => {
      mocks.inserts.push({ table: name, row })
      if (name === 'notifications') return Promise.resolve({ error: mocks.noticeError })
      return { select: () => ({ single: () => Promise.resolve({ data: { id: name + '-id' }, error: null }) }) }
    },
    update: (row: Record<string, unknown>) => { mocks.updates.push(row); return { eq: () => Promise.resolve({ error: null }) } },
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }
}

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.inserts.length = 0
  mocks.updates.length = 0
  mocks.noticeError = null
  mocks.permission.mockResolvedValue({ user: { id: 'admin-user' } })
  mocks.adminDb.mockResolvedValue({ from: table })
})

it('publishes the notice members read and marks the campaign completed', async () => {
  await publishInAppNotice(form({ name: 'Aula nova', body: 'A aula 4 está no ar.', target_url: '/app/cursos' }))
  expect(mocks.inserts.find(i => i.table === 'notifications')?.row).toEqual({ title: 'Aula nova', message: 'A aula 4 está no ar.', type: 'campaign', target_url: '/app/cursos' })
  expect(mocks.updates).toEqual([{ status: 'completed' }])
  expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'publish_in_app_notice' }))
})

it('rejects links outside the member area before writing anything', async () => {
  await expect(publishInAppNotice(form({ name: 'Oi', body: 'Teste', target_url: 'https://evil.example' }))).rejects.toThrow()
  expect(mocks.inserts).toEqual([])
})

it('marks the campaign failed when the notice cannot be saved', async () => {
  mocks.noticeError = { message: 'boom' }
  await expect(publishInAppNotice(form({ name: 'Oi', body: 'Teste' }))).rejects.toThrow('query')
  expect(mocks.updates).toEqual([{ status: 'failed' }])
})
