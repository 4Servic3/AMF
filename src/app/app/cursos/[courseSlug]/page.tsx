import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/auth-user';
import { Paywall } from '@/components/ui/paywall';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { gatewayHref } from '@/lib/commerce/gateway';
import { formatLessonDuration, lessonPathSegment } from '@/lib/lesson-route';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Real query to get course and access
export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  
  const supabase = await createClient();

  // 1. Usuário e curso em paralelo. Como o catálogo público é visível, courses vai retornar (RLS: só publicados).
  const [{ data: { user } }, { data: course, error }] = await Promise.all([
    getAuthUser(),
    supabase
      .from('courses')
      .select(`
        id, title, slug, short_description, workload, instructor_id,
        thumbnail_url,
        media_assets!cover_asset_id(file_path),
        certificate_rule
      `)
      .eq('slug', courseSlug)
      .eq('status', 'published')
      .single(),
  ]);
    
  if (error || !course) {
    notFound();
  }

  // 2. Acesso e grade em paralelo.
  // A grade usa admin/service_role de forma pontual APENAS para títulos e tempos,
  // OMITINDO rigorosamente secrets (playback, url). Sem acesso, nenhuma aula abre.
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [accessResult, { data: modulesData }] = await Promise.all([
    user ? supabase.rpc('has_course_access', { course_uuid: course.id }) : Promise.resolve({ data: false }),
    supabaseAdmin
      .from('course_modules')
      .select(`
        id, title, description, order_index,
        lessons (
          id, slug, title, type, duration_seconds, order_index, status,
          video_asset_id, external_resource_id
        )
      `)
      .eq('course_id', course.id)
      .eq('status', 'published')
      .order('order_index', { ascending: true }),
  ]);
  const hasAccess = !!user && !!accessResult.data;

  // Filtragem estrita de segurança e modelagem
  const modules = (modulesData || []).map(mod => ({
    ...mod,
    lessons: (mod.lessons || []).filter((l: any) => l.status === 'published' || l.status === 'coming_soon').sort((a: any, b: any) => a.order_index - b.order_index).map((l: any) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      status: l.status,
      duration_seconds: l.duration_seconds || 0,
      slug: lessonPathSegment(l),
      // NUNCA passamos IDs de assets privados para o cliente se ele não tem acesso
      hasVideo: !!l.video_asset_id,
      is_completed: false // Será preenchido abaixo
    }))
  }));

  // Buscar progresso
  let progressPercent = 0;
  let nextLesson = null;
  let completedCount = 0;
  let totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  if (hasAccess && user) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, is_completed, progress_percent')
      .eq('course_id', course.id)
      .eq('profile_id', user.id);

    const progMap = new Map((progress || []).map(p => [p.lesson_id, p]));
    
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        const p = progMap.get(lesson.id);
        if (p?.is_completed) {
          lesson.is_completed = true;
          completedCount++;
        } else if (!lesson.is_completed && !nextLesson) {
          nextLesson = lesson;
        }
      }
    }
    
    if (!nextLesson && modules.length > 0 && modules[0].lessons.length > 0) {
      nextLesson = modules[0].lessons[0];
    }
    
    progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  }

  const coverPath = course.thumbnail_url || (Array.isArray(course.media_assets)
    ? course.media_assets[0]?.file_path 
    : (course.media_assets as any)?.file_path) || '/assets/amf-casos/hero/hero-obstrucao-uretral.webp';
  const coverUrl = coverPath && !coverPath.startsWith('/') && !coverPath.startsWith('https://')
    ? supabase.storage.from('public_media').getPublicUrl(coverPath).data.publicUrl : coverPath;

  const minCompletion = course.certificate_rule?.min_completion_percent || 100;
  const certificateEnabled = !!course.certificate_rule?.enabled;

  const allLessons = modules.flatMap(m => m.lessons);
  const videoCount = allLessons.filter(l => l.type === 'video').length;
  const materialCount = allLessons.length - videoCount;
  const totalSeconds = allLessons.reduce((acc, l) => acc + (l.type === 'video' ? l.duration_seconds : 0), 0);
  const durationLabel = course.workload ? `${Math.round(course.workload / 60)}h` : formatLessonDuration(totalSeconds);
  const lessonUrl = (slug: string) => `/app/cursos/${encodeURIComponent(courseSlug)}/aula/${encodeURIComponent(slug)}`;
  const facts = [
    plural(modules.length, 'módulo', 'módulos'),
    videoCount > 0 ? plural(videoCount, 'videoaula', 'videoaulas') : null,
    materialCount > 0 ? plural(materialCount, 'material', 'materiais') : null,
    durationLabel ? `${durationLabel} de conteúdo` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="amf-course-page mx-auto flex w-full max-w-6xl flex-col px-4 pb-32 pt-5 sm:px-6 lg:pt-8">
      {/* Hero do curso */}
      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[#1C0D29] text-white shadow-[0_24px_60px_rgba(28,13,41,.22)] lg:mb-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(14,91,92,.55),transparent_60%),radial-gradient(80%_70%_at_0%_100%,rgba(212,173,98,.16),transparent_65%)]" aria-hidden="true" />
        <div className="relative grid gap-0 md:grid-cols-[1.15fr_1fr]">
          <div className="relative order-1 aspect-[16/10] md:order-2 md:aspect-auto md:min-h-[360px]">
            <Image src={coverUrl} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" unoptimized priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C0D29] via-[#1C0D29]/30 to-transparent md:bg-gradient-to-r md:from-[#1C0D29] md:via-[#1C0D29]/20" aria-hidden="true" />
          </div>

          <div className="relative order-2 flex flex-col gap-5 p-5 pt-0 sm:p-8 md:order-1 md:justify-center md:pt-8 lg:p-10">
            <Link href="/app/cursos" className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur transition-colors hover:bg-white/15 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
              Cursos
            </Link>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#E0C17E]">Curso AMF</p>
              <h1 className="font-editorial text-[30px] font-semibold leading-[1.12] text-white sm:text-4xl lg:text-[44px]" style={{ textWrap: 'balance' }}>{course.title}</h1>
              {course.short_description && (
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/75">{course.short_description}</p>
              )}
            </div>

            <ul className="flex flex-wrap gap-2" aria-label="Sobre o curso">
              {course.instructor_id && (
                <li className="rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-xs font-medium text-white/85">Equipe AMF</li>
              )}
              {facts.map(fact => (
                <li key={fact} className="rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-xs font-medium text-white/85">{fact}</li>
              ))}
              {certificateEnabled && (
                <li className="rounded-full border border-[#D4AD62]/40 bg-[#D4AD62]/10 px-3 py-1.5 text-xs font-medium text-[#E0C17E]">Com certificado</li>
              )}
            </ul>

            {hasAccess && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {nextLesson && (
                  <Link
                    href={lessonUrl(nextLesson.slug)}
                    className="amf-action inline-flex items-center justify-center gap-2 bg-[#D4AD62] px-7 py-3 text-sm font-bold text-[#1C0D29] shadow-[0_8px_24px_rgba(212,173,98,.35)] transition-colors hover:bg-[#E0C17E]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>
                    {completedCount > 0 ? 'Continuar curso' : 'Começar agora'}
                  </Link>
                )}
                <div className="min-w-0 flex-1 sm:max-w-[240px]">
                  <div className="mb-1.5 flex justify-between text-xs font-semibold text-white/80">
                    <span>{completedCount} de {totalLessons} concluídos</span>
                    <span className="tabular-nums text-[#79CCBF]">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso no curso">
                    <div className="h-full rounded-full bg-[#59BFAE]" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            )}
            {hasAccess && nextLesson && (
              <p className="-mt-2 text-xs text-white/55">
                {completedCount > 0 ? 'Próximo: ' : 'Primeiro conteúdo: '}<span className="text-white/80">{nextLesson.title}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {!hasAccess ? (
        <Paywall
          title="Acesso Exclusivo"
          description="Para assistir às aulas e baixar os materiais deste curso, libere o seu acesso."
          themeColor="#160820"
          ctaText="Liberar acesso"
          ctaUrl={gatewayHref({ kind: 'course', slug: course.slug }, 'cursos')}
        />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Conteúdo do curso */}
          <section className="flex min-w-0 flex-1 flex-col gap-4" aria-labelledby="course-content-heading">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <h2 id="course-content-heading" className="text-xl font-semibold text-[#1C0D29]">Conteúdo do curso</h2>
                <p className="mt-0.5 text-sm text-[#68727E]">{plural(modules.length, 'módulo', 'módulos')} · {plural(totalLessons, 'conteúdo', 'conteúdos')}</p>
              </div>
            </div>
            {modules.map((mod, i) => {
              const done = mod.lessons.filter((l: any) => l.is_completed).length;
              const modDone = mod.lessons.length > 0 && done === mod.lessons.length;
              return (
              <details key={mod.id} className="group overflow-hidden rounded-[22px] border border-[#EDE5D8] bg-white shadow-[0_1px_2px_rgba(28,13,41,.04),0_8px_24px_rgba(28,13,41,.05)]" open={i === 0}>
                <summary className="flex cursor-pointer select-none list-none items-center gap-4 p-4 transition-colors hover:bg-[#FAF7F1] sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${modDone ? 'bg-[#0E5B5C] text-white' : 'bg-[#F5F0E7] text-[#1C0D29]'}`} aria-hidden="true">
                    {modDone ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    ) : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-[.12em] text-[#B08A43]">Módulo {i + 1}</span>
                    <span className="block font-semibold leading-snug text-[#1C0D29]">{mod.title}</span>
                    <span className="mt-0.5 block text-xs text-[#68727E]">{done} de {plural(mod.lessons.length, 'conteúdo concluído', 'conteúdos concluídos')}</span>
                  </span>
                  <svg className="h-5 w-5 shrink-0 text-[#68727E] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <ol className="border-t border-[#F0EADF]">
                  {mod.lessons.map((lesson: any) => {
                    const isComingSoon = lesson.status === 'coming_soon';
                    const isVideo = lesson.type === 'video';
                    const isPdf = lesson.type === 'pdf_material';
                    const isExternal = lesson.type === 'external_link';
                    const isNext = !!nextLesson && nextLesson.id === lesson.id && !lesson.is_completed;
                    const kind = isComingSoon ? 'Em breve' : isVideo ? 'Videoaula' : isPdf ? 'Material em PDF' : isExternal ? 'Comunidade' : 'Material';
                    const meta = isVideo ? formatLessonDuration(lesson.duration_seconds) : null;

                    const innerContent = (
                      <>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${lesson.is_completed ? 'bg-[#0E5B5C] text-white' : isComingSoon ? 'bg-[#F5F0E7] text-[#9AA1A9]' : isNext ? 'bg-[#1C0D29] text-[#E0C17E]' : 'bg-[#F5F0E7] text-[#1C0D29]'}`} aria-hidden="true">
                          {lesson.is_completed ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          ) : isComingSoon ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          ) : isPdf ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          ) : isExternal ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[15px] font-semibold leading-snug ${isComingSoon ? 'text-[#9AA1A9]' : 'text-[#1C0D29]'}`}>{lesson.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#68727E]">
                            <span>{kind}</span>
                            {meta && <><span aria-hidden="true">·</span><span>{meta}</span></>}
                            {lesson.is_completed && <><span aria-hidden="true">·</span><span className="font-medium text-[#0E5B5C]">Concluído</span></>}
                            {isNext && <span className="rounded-full bg-[#D4AD62]/20 px-2 py-0.5 text-[11px] font-semibold text-[#8A6A2C]">Próximo</span>}
                          </span>
                        </span>
                        {!isComingSoon && (
                          <svg className="h-5 w-5 shrink-0 text-[#C8BFB1] transition-colors group-hover/link:text-[#B08A43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                        )}
                      </>
                    );

                    if (isComingSoon) {
                      return (
                        <li key={lesson.id} className="flex cursor-not-allowed items-center gap-4 border-b border-[#F0EADF] px-4 py-3.5 last:border-0 sm:px-5">
                          {innerContent}
                        </li>
                      );
                    }

                    return (
                      <li key={lesson.id} className="border-b border-[#F0EADF] last:border-0">
                        <Link
                          href={lessonUrl(lesson.slug)}
                          className={`group/link flex min-h-[64px] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[#FAF7F1] sm:px-5 ${isNext ? 'bg-[#FBF8F2]' : ''}`}
                        >
                          {innerContent}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </details>
              );
            })}
          </section>

          {/* Lateral */}
          <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:w-[320px]">
            {certificateEnabled && (
              <div className="relative overflow-hidden rounded-[22px] bg-[#1C0D29] p-6 text-white shadow-sm">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D4AD62]/15 blur-2xl" aria-hidden="true" />
                <h3 className="relative mb-2 font-editorial text-xl font-semibold text-[#E0C17E]">Certificado</h3>
                <p className="relative mb-5 text-sm leading-relaxed text-white/75">Conclua ao menos {minCompletion}% do curso para emitir seu certificado autenticado.</p>
                <div className="relative mb-5 h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                  <div className="h-full rounded-full bg-[#D4AD62]" style={{ width: `${Math.min(100, (progressPercent / minCompletion) * 100)}%` }} />
                </div>
                {progressPercent >= minCompletion ? (
                  <Link href={`/app/certificados/preview-${course.id}`} className="relative block w-full rounded-full bg-[#D4AD62] py-3 text-center text-sm font-bold text-[#1C0D29] transition-colors hover:bg-[#E0C17E]">
                    Emitir Certificado
                  </Link>
                ) : (
                  <button disabled className="amf-action relative w-full cursor-not-allowed rounded-full border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/50">
                    Faltam {Math.max(0, minCompletion - progressPercent)}% para liberar
                  </button>
                )}
              </div>
            )}
            <div className="rounded-[22px] border border-[#EDE5D8] bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-[#1C0D29]">Seu progresso</h3>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-[#FAF7F1] px-2 py-3">
                  <dt className="text-[11px] text-[#68727E]">Concluídos</dt>
                  <dd className="text-lg font-semibold tabular-nums text-[#0E5B5C]">{completedCount}</dd>
                </div>
                <div className="rounded-2xl bg-[#FAF7F1] px-2 py-3">
                  <dt className="text-[11px] text-[#68727E]">Restantes</dt>
                  <dd className="text-lg font-semibold tabular-nums text-[#1C0D29]">{Math.max(0, totalLessons - completedCount)}</dd>
                </div>
                <div className="rounded-2xl bg-[#FAF7F1] px-2 py-3">
                  <dt className="text-[11px] text-[#68727E]">Progresso</dt>
                  <dd className="text-lg font-semibold tabular-nums text-[#1C0D29]">{progressPercent}%</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
