import { describe, expect, it } from 'vitest'
import { canPlayCaseStory } from '@/lib/case-story-access'

describe('case story preview rule', () => {
  it('opens only the first published story without the cases product', () => {
    expect(canPlayCaseStory(false, 'first', 'first')).toBe(true)
    expect(canPlayCaseStory(false, 'second', 'first')).toBe(false)
  })
  it('never opens a story when the first story cannot be determined', () => {
    expect(canPlayCaseStory(false, 'first', null)).toBe(false)
  })
  it('opens every story with full cases access', () => {
    expect(canPlayCaseStory(true, 'second', 'first')).toBe(true)
  })
})
