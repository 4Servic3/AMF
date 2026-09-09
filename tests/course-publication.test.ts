import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ permission: vi.fn(), session: vi.fn(), rpc: vi.fn() }))
vi.mock('@/lib/auth/dal', () => ({ requireAal2: mocks.session, requirePermission: mocks.permission, writeAdminAuditEvent: vi.fn(), hasPermission: vi.fn() }))
vi.mock('@/lib/supabase/service-role', () => ({ createServiceRoleClient: () => ({ rpc: mocks.rpc }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
import { publishCourse, scheduleCourse } from '@/app/admin/actions/courses'
const course = '11111111-1111-4111-8111-111111111111'
beforeEach(() => { vi.resetAllMocks(); mocks.session.mockResolvedValue({ user: { id: 'actor' } }) })
describe('Course publication actions', () => {
  it('never invokes publication without publish permission', async () => {
    mocks.permission.mockRejectedValue(new Error('forbidden'))
    await expect(publishCourse(course, 1)).rejects.toThrow('forbidden')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('returns an actionable validation error without claiming success', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: 'P0001', message: 'Envie um vídeo para Aula 1.' } })
    expect(await publishCourse(course, 1)).toEqual({ success: false, error: 'Envie um vídeo para Aula 1.' })
  })
  it('does not expose infrastructure error details', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: 'XX000', message: 'private database details' } })
    const result = await publishCourse(course, 1)
    expect(result.success).toBe(false)
    expect(result.error).not.toContain('private')
  })
  it('preserves the selected UTC instant when scheduling', async () => {
    mocks.rpc.mockResolvedValue({ error: null })
    expect((await scheduleCourse(course, 4, '2026-10-01T15:00:00.000Z')).success).toBe(true)
    expect(mocks.rpc).toHaveBeenCalledWith('schedule_course_publication', { p_course: course, p_actor: 'actor', p_version: 4, p_at: '2026-10-01T15:00:00.000Z' })
  })
  it('cancels through the same serialized database operation', async () => {
    mocks.rpc.mockResolvedValue({ error: null })
    expect((await scheduleCourse(course, 4, null)).success).toBe(true)
    expect(mocks.rpc).toHaveBeenCalledWith('schedule_course_publication', expect.objectContaining({ p_at: null }))
  })
})
