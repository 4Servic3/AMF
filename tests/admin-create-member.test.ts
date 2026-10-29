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
    : table === 'products'
      ? { select: () => ({ eq: () => ({ eq: () => ({ neq: () => ({ maybeSingle: mocks.courseMaybeSingle }) }) }) }) }
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

it('grants several courses and products with one shared expiry date', async () => {
  const course = '11111111-1111-4111-8111-111111111111'
  const product = '22222222-2222-4222-8222-222222222222'
  const result = await createMemberTestUser({ temporary: true, courseIds: [course], productIds: [product], expiresAt: '2099-12-31' })
  expect(result.success).toBe(true)
  expect(mocks.rpc).toHaveBeenCalledWith('course_access_admin', expect.objectContaining({ p_course: course, p_expires: '2100-01-01T02:59:59.000Z' }))
  expect(mocks.rpc).toHaveBeenCalledWith('product_access_admin', expect.objectContaining({ p_product: product, p_profile: 'created-user', p_expires: '2100-01-01T02:59:59.000Z' }))
})

it('rejects a past expiry date before creating the account', async () => {
  expect(await createMemberTestUser({ temporary: true, productIds: ['22222222-2222-4222-8222-222222222222'], expiresAt: '2000-01-01' })).toMatchObject({ success: false })
  expect(mocks.createUser).not.toHaveBeenCalled()
})

it('removes the new account when a product grant fails', async () => {
  mocks.rpc.mockResolvedValue({ error: { message: 'boom' } })
  const result = await createMemberTestUser({ temporary: true, productIds: ['22222222-2222-4222-8222-222222222222'] })
  expect(result).toMatchObject({ success: false })
  expect(mocks.deleteUser).toHaveBeenCalledWith('created-user')
})
