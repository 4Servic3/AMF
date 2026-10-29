import { expect, it } from 'vitest'
import { dueLabel, subscriptionCounts } from '@/lib/admin/subscription-due'

const now = Date.parse('2026-10-29T12:00:00Z')

it('describes how far the next due date is', () => {
  expect(dueLabel('2026-11-03T12:00:00Z', now)).toBe('Vence em 5 dias')
  expect(dueLabel('2026-10-30T12:00:00Z', now)).toBe('Vence amanhã')
  expect(dueLabel('2026-10-29T18:00:00Z', now)).toBe('Vence hoje')
  expect(dueLabel('2026-10-26T12:00:00Z', now)).toBe('Venceu há 3 dias')
  expect(dueLabel(null, now)).toBe('Sem data')
})

it('counts active, due within a week and late subscriptions', () => {
  expect(subscriptionCounts([
    { status: 'active', current_period_end: '2026-11-02T00:00:00Z' },
    { status: 'active', current_period_end: '2026-12-29T00:00:00Z' },
    { status: 'past_due', current_period_end: '2026-10-20T00:00:00Z' },
    { status: 'canceled', current_period_end: '2026-10-01T00:00:00Z' },
  ], now)).toEqual({ active: 2, dueSoon: 1, late: 1 })
})
