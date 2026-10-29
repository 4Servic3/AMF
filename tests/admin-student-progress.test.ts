import { describe, expect, it } from 'vitest';
import { courseFunnel, progressKpis, stuckLessons, summarizeStudents, weeklyActivity, type ProgressLesson } from '@/lib/admin/student-progress';

const now = Date.parse('2026-10-29T12:00:00Z');
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
const lessons: ProgressLesson[] = [
  { id: 'l3', title: 'Aula 3', moduleOrder: 2, order: 1 },
  { id: 'l1', title: 'Aula 1', moduleOrder: 1, order: 1 },
  { id: 'l2', title: 'Aula 2', moduleOrder: 1, order: 2 },
];
const profile = (id: string) => ({ id, full_name: id.toUpperCase(), email: `${id}@amf.test`, created_at: daysAgo(100) });
const grant = (profile_id: string, extra = {}) => ({ profile_id, status: 'active', starts_at: daysAgo(40), expires_at: null, created_at: daysAgo(40), ...extra });
const done = (profile_id: string, lesson_id: string, days: number) => ({ profile_id, lesson_id, is_completed: true, updated_at: daysAgo(days), completed_at: daysAgo(days) });

function build() {
  return summarizeStudents({
    lessons,
    grants: [grant('ana'), grant('bia'), grant('caio'), grant('davi', { created_at: daysAgo(2) }), grant('eva', { status: 'revoked' }), grant('fil', { expires_at: daysAgo(1) })],
    progress: [
      done('ana', 'l1', 30), done('ana', 'l2', 20), done('ana', 'l3', 10),
      done('bia', 'l1', 20),
      done('caio', 'l1', 3), done('caio', 'l2', 1),
      done('zed', 'outro-curso', 1),
    ],
    profiles: ['ana', 'bia', 'caio', 'davi', 'eva', 'fil'].map(profile),
    certificates: [{ profile_id: 'ana' }],
    allStudents: false,
    now,
  });
}

describe('progresso dos alunos no painel', () => {
  it('conta só quem tem acesso vigente e classifica cada aluno', () => {
    const rows = Object.fromEntries(build().map(s => [s.id, s]));
    expect(Object.keys(rows).sort()).toEqual(['ana', 'bia', 'caio', 'davi']);
    expect(rows.ana).toMatchObject({ state: 'concluiu', percent: 100, certificate: true, nextLesson: null });
    expect(rows.bia).toMatchObject({ state: 'parado', percent: 33, nextLesson: 'Aula 2', lastLesson: 'Aula 1' });
    expect(rows.caio).toMatchObject({ state: 'ativo', percent: 67, nextLesson: 'Aula 3', lastLesson: 'Aula 2' });
    expect(rows.davi).toMatchObject({ state: 'nunca', percent: 0, lastActivity: null, nextLesson: 'Aula 1' });
  });

  it('com liberação geral, todo cadastro entra a partir da data de cadastro', () => {
    const rows = summarizeStudents({ lessons, grants: [], progress: [], profiles: [profile('ana')], certificates: [], allStudents: true, now });
    expect(rows).toHaveLength(1);
    expect(rows[0].accessSince).toBe(daysAgo(100));
  });

  it('monta funil, aulas onde param e números do topo', () => {
    const students = build();
    expect(courseFunnel(students).map(s => s.value)).toEqual([4, 3, 2, 1, 1]);
    expect(stuckLessons(students)).toEqual([{ lesson: 'Aula 2', count: 1 }, { lesson: 'Aula 3', count: 1 }]);
    expect(progressKpis(students, now)).toEqual({ students: 4, active30: 3, new7: 1, averagePercent: 50, certificates: 1 });
  });

  it('agrupa a atividade em 12 semanas, a última termina agora', () => {
    const weeks = weeklyActivity([done('ana', 'l1', 1), done('bia', 'l1', 2), done('ana', 'l2', 90), done('caio', 'l1', 200)], now);
    expect(weeks).toHaveLength(12);
    expect(weeks[11]).toMatchObject({ completions: 2, active: 2 });
    expect(weeks.reduce((sum, w) => sum + w.completions, 0)).toBe(2);
  });
});
