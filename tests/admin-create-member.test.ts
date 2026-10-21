import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ permission: vi.fn(), adminDb: vi.fn(), createUser: vi.fn(), deleteUser: vi.fn(), profileInsert: vi.fn(), rpc: vi.fn(), from: vi.fn(), audit: vi.fn(), courseMaybeSingle: vi.fn() }))
vi.mock('@/lib/auth/dal', () => ({ requirePermission: mocks.permission, writeAdminAuditEvent: mocks.audit, requireAal2: vi.fn(), hasPermission: vi.fn() }))
vi.mock('@/lib/admin-data', () => ({ adminDb: mocks.adminDb, queryError: (error: unknown) => { if (error) throw new Error('query') } }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createMemberTestUser } from '@/app/admin/actions/users'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.permission.mockResolvedValue({ user: { id: 'admin-user' } })
  mocks.createUser.mockResolvedValue({ data: { user: { id: 'created-user' } }, error: null })
  mocks.deleteUser.mockResolvedValue({ error: null })
  mocks.profileInsert.mockResolvedValue({ error: null })
  mocks.rpc.mockResolvedValue({ error: null })
  mocks.from.mockImplementation((table: string) => table === 'courses'
    ? { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.courseMaybeSingle }) }) }) }
    : { insert: mocks.profileInsert })
  mocks.courseMaybeSingle.mockResolvedValue({ data: { id: 'course-id' }, error: null })
  mocks.adminDb.mockResolvedValue({ from: mocks.from, rpc: mocks.rpc, auth: { admin: { createUser: mocks.createUser, deleteUser: mocks.deleteUser } } })
})

it('creates a random test login as a member and saves no extra role fields', async () => {
  const result = await createMemberTestUser({ temporary: true, courseId: null })
  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.email).toMatch(/^teste-[0-9a-f-]+@example\.invalid$/)
  expect(result.password.length).toBeGreaterThan(24)
  expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: result.email, password: result.password, email_confirm: true, user_metadata: expect.objectContaining({ full_name: 'Conta de teste AMF' }) }))
  expect(mocks.profileInsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'created-user', email: result.email, role: 'member' }))
  expect(mocks.rpc).not.toHaveBeenCalled()
})

it('rejects malformed inputs before creating an Auth account', async () => {
  expect(await createMemberTestUser({ temporary: false, email: 'not-email', fullName: '', password: '' })).toMatchObject({ success: false })
  expect(mocks.createUser).not.toHaveBeenCalled()
})

it('requires the users.manage permission before parsing or mutating', async () => {
  mocks.permission.mockRejectedValue(new Error('denied'))
  await expect(createMemberTestUser({ temporary: true })).rejects.toThrow('denied')
  expect(mocks.createUser).not.toHaveBeenCalled()
})

it('grants a selected published course through the existing audited access RPC', async () => {
  const result = await createMemberTestUser({ temporary: true, courseId: '11111111-1111-4111-8111-111111111111' })
  expect(result.success).toBe(true)
  expect(mocks.rpc).toHaveBeenCalledWith('course_access_admin', expect.objectContaining({ p_course: '11111111-1111-4111-8111-111111111111', p_actor: 'admin-user' }))
})
