import { describe, expect, it } from 'vitest'
import { formatLessonDuration, lessonHref, lessonLookup } from '@/lib/lesson-route'

describe('lesson addresses', () => {
  it('links lessons by slug so home, course page and player agree', () => {
    expect(lessonHref('imersao-clinica-de-felinos-parte-1', { id: 'a56f95f6-d8c0-4bbf-82d9-559aa325461d', slug: 'aula-1' }))
      .toBe('/app/cursos/imersao-clinica-de-felinos-parte-1/aula/aula-1')
  })
  it('falls back to the id when a lesson has no usable slug', () => {
    expect(lessonHref('curso', { id: 'a56f95f6-d8c0-4bbf-82d9-559aa325461d', slug: null }))
      .toBe('/app/cursos/curso/aula/a56f95f6-d8c0-4bbf-82d9-559aa325461d')
  })
  it('resolves both slugs and legacy id links', () => {
    expect(lessonLookup('aula-1')).toEqual({ column: 'slug', value: 'aula-1' })
    expect(lessonLookup('A56F95F6-D8C0-4BBF-82D9-559AA325461D')).toEqual({ column: 'id', value: 'a56f95f6-d8c0-4bbf-82d9-559aa325461d' })
  })
  it('rejects anything else', () => {
    expect(lessonLookup('aula 1')).toBeNull()
    expect(lessonLookup("1' or '1'='1")).toBeNull()
  })
})

describe('lesson duration', () => {
  it('reads naturally', () => {
    expect(formatLessonDuration(45 * 60)).toBe('45 min')
    expect(formatLessonDuration(3600)).toBe('1h')
    expect(formatLessonDuration(460 * 60)).toBe('7h40')
    expect(formatLessonDuration(20)).toBe('1 min')
  })
  it('hides unknown durations', () => {
    expect(formatLessonDuration(0)).toBeNull()
    expect(formatLessonDuration(null)).toBeNull()
  })
})
