import { describe, expect, it } from 'vitest'
import { summarizeMemberCourses, type MemberCourse, type MemberLesson } from '@/lib/member-course-summary'

const course: MemberCourse = { id: 'c1', title: 'Imersão', slug: 'imersao', thumbnail_url: null, short_description: null, all_students: false }
const lessons: MemberLesson[] = Array.from({ length: 10 }, (_, i) => ({ id: `l${i}`, module_id: 'm1', title: `Aula ${i + 1}`, slug: `aula-${i + 1}`, type: 'video', is_mandatory: true, course_modules: { course_id: 'c1' } }))

describe('summarizeMemberCourses', () => {
  it('shows a started course as in progress even when the average rounds to zero', () => {
    const [summary] = summarizeMemberCourses([course], lessons, [{ lesson_id: 'l0', progress_percent: 2, is_completed: false, updated_at: '2026-10-29T10:00:00Z' }])
    expect(summary).toMatchObject({ status: 'in_progress', progressPercent: 1, lastLessonTitle: 'Aula 1' })
  })

  it('keeps an untouched course at zero', () => {
    const [summary] = summarizeMemberCourses([course], lessons, [])
    expect(summary).toMatchObject({ status: 'not_started', progressPercent: 0 })
  })
})
