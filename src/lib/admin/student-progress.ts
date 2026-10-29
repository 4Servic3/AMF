/**
 * Progresso dos alunos em um curso, calculado a partir das linhas do banco.
 * Funções puras: o painel do admin busca os dados e só monta a visão aqui.
 */
export type ProgressLesson = { id: string; title: string; moduleOrder: number; order: number };
export type ProgressGrant = { profile_id: string; status: string; starts_at: string | null; expires_at: string | null; created_at: string };
export type ProgressRow = { profile_id: string; lesson_id: string; is_completed: boolean; updated_at: string; completed_at?: string | null };
export type ProgressProfile = { id: string; full_name: string | null; email: string | null; created_at: string };
export type ProgressCertificate = { profile_id: string };

export type StudentState = 'nunca' | 'parado' | 'ativo' | 'concluiu';
export type StudentProgress = {
  id: string;
  name: string;
  email: string | null;
  accessSince: string;
  completed: number;
  total: number;
  percent: number;
  lastActivity: string | null;
  lastLesson: string | null;
  nextLesson: string | null;
  certificate: boolean;
  state: StudentState;
};

export const STALLED_DAYS = 14;
const DAY = 86_400_000;

function grantIsActive(grant: ProgressGrant, now: number) {
  return grant.status === 'active'
    && (!grant.starts_at || Date.parse(grant.starts_at) <= now)
    && (!grant.expires_at || Date.parse(grant.expires_at) > now);
}

/** Aulas na ordem do curso: módulo, depois aula. */
export function orderLessons(lessons: ProgressLesson[]) {
  return [...lessons].sort((a, b) => a.moduleOrder - b.moduleOrder || a.order - b.order || a.id.localeCompare(b.id));
}

export function summarizeStudents(input: {
  lessons: ProgressLesson[];
  grants: ProgressGrant[];
  progress: ProgressRow[];
  profiles: ProgressProfile[];
  certificates: ProgressCertificate[];
  allStudents: boolean;
  now: number;
}): StudentProgress[] {
  const { now } = input;
  const lessons = orderLessons(input.lessons);
  const lessonIds = new Set(lessons.map(l => l.id));
  const since = new Map<string, string>();
  if (input.allStudents) for (const p of input.profiles) since.set(p.id, p.created_at);
  for (const grant of input.grants) {
    if (!grantIsActive(grant, now)) continue;
    const current = since.get(grant.profile_id);
    if (!current || grant.created_at < current) since.set(grant.profile_id, grant.created_at);
  }
  const byStudent = new Map<string, ProgressRow[]>();
  for (const row of input.progress) {
    if (!lessonIds.has(row.lesson_id)) continue;
    (byStudent.get(row.profile_id) ?? byStudent.set(row.profile_id, []).get(row.profile_id)!).push(row);
  }
  const certified = new Set(input.certificates.map(c => c.profile_id));
  const profiles = new Map(input.profiles.map(p => [p.id, p]));
  const title = new Map(lessons.map(l => [l.id, l.title]));

  return [...since.entries()].flatMap(([id, accessSince]) => {
    const profile = profiles.get(id);
    if (!profile) return [];
    const rows = byStudent.get(id) ?? [];
    const done = new Set(rows.filter(r => r.is_completed).map(r => r.lesson_id));
    const latest = rows.reduce<ProgressRow | null>((a, r) => (!a || r.updated_at > a.updated_at ? r : a), null);
    const total = lessons.length;
    const percent = total ? Math.round((done.size / total) * 100) : 0;
    const next = lessons.find(l => !done.has(l.id)) ?? null;
    const lastActivity = latest?.updated_at ?? null;
    const state: StudentState = total > 0 && done.size >= total ? 'concluiu'
      : !rows.length ? 'nunca'
      : now - Date.parse(lastActivity!) > STALLED_DAYS * DAY ? 'parado' : 'ativo';
    return [{
      id,
      name: profile.full_name || profile.email?.split('@')[0] || 'Aluno',
      email: profile.email,
      accessSince,
      completed: done.size,
      total,
      percent,
      lastActivity,
      lastLesson: latest ? title.get(latest.lesson_id) ?? null : null,
      nextLesson: next?.title ?? null,
      certificate: certified.has(id),
      state,
    }];
  });
}

export function courseFunnel(students: StudentProgress[]) {
  return [
    { key: 'liberados', label: 'Com acesso', value: students.length },
    { key: 'comecaram', label: 'Começaram', value: students.filter(s => s.completed > 0 || s.lastActivity).length },
    { key: 'metade', label: 'Passaram da metade', value: students.filter(s => s.percent >= 50).length },
    { key: 'concluiram', label: 'Concluíram', value: students.filter(s => s.state === 'concluiu').length },
    { key: 'certificado', label: 'Emitiram certificado', value: students.filter(s => s.certificate).length },
  ];
}

/** Aulas em que mais alunos pararam: a próxima aula de quem começou e não terminou. */
export function stuckLessons(students: StudentProgress[], limit = 5) {
  const counts = new Map<string, number>();
  for (const s of students) {
    if ((s.state === 'parado' || s.state === 'ativo') && s.nextLesson) counts.set(s.nextLesson, (counts.get(s.nextLesson) ?? 0) + 1);
  }
  return [...counts.entries()].map(([lesson, count]) => ({ lesson, count }))
    .sort((a, b) => b.count - a.count || a.lesson.localeCompare(b.lesson)).slice(0, limit);
}

/** Aulas concluídas e alunos ativos por semana, das mais antigas para a atual. */
export function weeklyActivity(progress: ProgressRow[], now: number, weeks = 12) {
  const start = now - weeks * 7 * DAY;
  const buckets = Array.from({ length: weeks }, (_, i) => ({ weekStart: new Date(start + i * 7 * DAY).toISOString(), completions: 0, active: new Set<string>() }));
  for (const row of progress) {
    const at = Date.parse(row.updated_at);
    if (at > start && at <= now) buckets[Math.min(weeks - 1, Math.floor((at - start) / (7 * DAY)))].active.add(row.profile_id);
    const doneAt = row.is_completed ? Date.parse(row.completed_at || row.updated_at) : NaN;
    if (doneAt > start && doneAt <= now) buckets[Math.min(weeks - 1, Math.floor((doneAt - start) / (7 * DAY)))].completions++;
  }
  return buckets.map(b => ({ weekStart: b.weekStart, completions: b.completions, active: b.active.size }));
}

export function progressKpis(students: StudentProgress[], now: number) {
  const recent = (iso: string | null, days: number) => !!iso && now - Date.parse(iso) <= days * DAY;
  return {
    students: students.length,
    active30: students.filter(s => recent(s.lastActivity, 30)).length,
    new7: students.filter(s => recent(s.accessSince, 7)).length,
    averagePercent: students.length ? Math.round(students.reduce((sum, s) => sum + s.percent, 0) / students.length) : 0,
    certificates: students.filter(s => s.certificate).length,
  };
}
