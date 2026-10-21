/**
 * Endereço público de uma aula. O segmento canônico é o slug da aula; o id
 * continua aceito para links antigos já compartilhados.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type LessonRef = { id: string; slug?: string | null };

export function lessonPathSegment(lesson: LessonRef): string {
  return lesson.slug && SLUG.test(lesson.slug) ? lesson.slug : lesson.id;
}

export function lessonHref(courseSlug: string, lesson: LessonRef): string {
  return `/app/cursos/${encodeURIComponent(courseSlug)}/aula/${encodeURIComponent(lessonPathSegment(lesson))}`;
}

/** Coluna usada para localizar a aula a partir do segmento da URL; `null` = segmento inválido. */
export function lessonLookup(segment: string): { column: 'id' | 'slug'; value: string } | null {
  const value = decodeURIComponent(segment);
  if (UUID.test(value)) return { column: 'id', value: value.toLowerCase() };
  if (SLUG.test(value)) return { column: 'slug', value };
  return null;
}

/** "45 min", "1h", "7h40" — duração legível de vídeo. */
export function formatLessonDuration(seconds: number | null | undefined): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${String(rest).padStart(2, '0')}` : `${hours}h`;
}
