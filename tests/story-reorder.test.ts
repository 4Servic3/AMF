import { expect, it } from 'vitest'
import { reorderedTimestamps } from '@/lib/story-lifecycle'

const rows = [
  { id: 'a', created_at: '2026-10-01T10:00:00.000Z' },
  { id: 'b', created_at: '2026-10-02T10:00:00.000Z' },
  { id: 'c', created_at: '2026-10-03T10:00:00.000Z' },
]

it('moves the existing times so the stories follow the new order', () => {
  expect(reorderedTimestamps(rows, ['c', 'a', 'b'])).toEqual([
    { id: 'c', created_at: '2026-10-01T10:00:00.000Z' },
    { id: 'a', created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'b', created_at: '2026-10-03T10:00:00.000Z' },
  ])
})

it('returns only the stories that change', () => {
  expect(reorderedTimestamps(rows, ['b', 'a', 'c'])).toHaveLength(2)
  expect(reorderedTimestamps(rows, ['a', 'b', 'c'])).toEqual([])
})

it('keeps a strict order when two stories share the same time', () => {
  const same = [{ id: 'a', created_at: '2026-10-01T10:00:00.000Z' }, { id: 'b', created_at: '2026-10-01T10:00:00.000Z' }]
  expect(reorderedTimestamps(same, ['b', 'a'])).toEqual([{ id: 'a', created_at: '2026-10-01T10:00:00.001Z' }])
})

it('refuses a list that does not match the case', () => {
  expect(reorderedTimestamps(rows, ['a', 'b'])).toBeNull()
  expect(reorderedTimestamps(rows, ['a', 'b', 'x'])).toBeNull()
  expect(reorderedTimestamps(rows, ['a', 'a', 'b'])).toBeNull()
})
