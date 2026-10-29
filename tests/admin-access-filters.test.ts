import { expect, it } from 'vitest'
import { accessCounts, filterAccess, type AccessRow } from '@/lib/admin/access-filters'

const now = Date.parse('2026-10-29T12:00:00Z')
const row = (over: Partial<AccessRow>): AccessRow => ({ resource_type: 'course', resource_id: 'c1', source_type: 'manual', status: 'active', starts_at: '2026-01-01T00:00:00Z', expires_at: null, profile: { full_name: 'Ana Souza', email: 'ana@x.com' }, ...over })

const rows = [
  row({}),
  row({ resource_type: 'product', resource_id: 'p1', source_type: 'purchase', expires_at: '2026-11-10T00:00:00Z', profile: { full_name: 'Bruno', email: 'bruno@x.com' } }),
  row({ status: 'revoked', profile: { full_name: 'Carla', email: 'carla@x.com' } }),
  row({ expires_at: '2026-10-01T00:00:00Z', profile: { full_name: 'Davi', email: 'davi@x.com' } }),
]

it('searches by name or email, ignoring case', () => {
  expect(filterAccess(rows, { q: 'ANA' }, now)).toHaveLength(1)
  expect(filterAccess(rows, { q: 'bruno@' }, now)[0].resource_id).toBe('p1')
})

it('filters by resource, origin and situation together', () => {
  expect(filterAccess(rows, { recurso: 'product:p1' }, now)).toHaveLength(1)
  expect(filterAccess(rows, { origem: 'manual', situacao: 'ativos' }, now)).toHaveLength(1)
  expect(filterAccess(rows, { situacao: 'vencendo' }, now)[0].profile?.full_name).toBe('Bruno')
  expect(filterAccess(rows, { situacao: 'expirados' }, now)[0].profile?.full_name).toBe('Davi')
  expect(filterAccess(rows, { situacao: 'revogados' }, now)[0].profile?.full_name).toBe('Carla')
})

it('counts only active accesses', () => {
  expect(accessCounts(rows, now)).toEqual({ active: 2, soon: 1, manual: 1, paid: 1 })
})
