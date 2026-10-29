import { describe, expect, it } from 'vitest';
import { buildStudentCourses } from '@/lib/admin/student-courses';

const mod = (id: string, order: number, course_id = 'c1') => ({ id, title: `Módulo ${id}`, order_index: order, course_id });
const lessons = [
  { id: 'b', title: 'B', type: 'video', order_index: 1, course_modules: mod('m2', 2) },
  { id: 'a2', title: 'A2', type: 'pdf_material', order_index: 2, course_modules: mod('m1', 1) },
  { id: 'a1', title: 'A1', type: 'video', order_index: 1, course_modules: mod('m1', 1) },
  { id: 'x', title: 'X', type: 'video', order_index: 1, course_modules: mod('mx', 1, 'c2') },
];

describe('ficha do aluno: aprendizado', () => {
  it('ordena por módulo e aula e marca cada aula', () => {
    const [course] = buildStudentCourses({
      courses: [{ id: 'c1', title: 'Imersão' }, { id: 'c2', title: 'Outro' }],
      lessons,
      progress: [
        { lesson_id: 'a1', is_completed: true, progress_percent: 100, updated_at: '2026-10-01' },
        { lesson_id: 'a2', is_completed: false, progress_percent: '42.5', updated_at: '2026-10-05' },
      ],
      accessibleCourseIds: new Set(['c1']),
    });
    expect(course).toMatchObject({ id: 'c1', completed: 1, total: 3, percent: 33, lastActivity: '2026-10-05', hasAccess: true });
    expect(course.modules.map((m) => m.lessons.map((l) => `${l.id}:${l.state}:${l.percent}`))).toEqual([
      ['a1:concluida:100', 'a2:andamento:43'],
      ['b:pendente:0'],
    ]);
  });

  it('inclui curso sem acesso só se o aluno já começou', () => {
    const none = buildStudentCourses({ courses: [{ id: 'c2', title: 'Outro' }], lessons, progress: [], accessibleCourseIds: new Set() });
    expect(none).toEqual([]);
    const started = buildStudentCourses({ courses: [{ id: 'c2', title: 'Outro' }], lessons, progress: [{ lesson_id: 'x', is_completed: false, progress_percent: 10, updated_at: '2026-10-01' }], accessibleCourseIds: new Set() });
    expect(started[0]).toMatchObject({ hasAccess: false, percent: 0 });
  });
});
