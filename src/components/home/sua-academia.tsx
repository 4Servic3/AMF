import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, BookOpen, ChevronRight, GraduationCap, PlayCircle } from 'lucide-react';

export type UserCourseProgress = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  coverUrl?: string | null;
  lastLessonTitle?: string;
  lastLessonSlug?: string;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'completed';
};

export function SuaAcademia({ courses }: { courses: UserCourseProgress[]; materialsCount?: number }) {
  return (
    <section aria-labelledby="home-academy-title" className="mb-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="home-academy-title" className="amf-section-heading font-editorial text-2xl text-[#16051F]">Sua Academia</h2>
          <p className="mt-1 text-sm text-[#667085]">Seus cursos e seu progresso</p>
        </div>
        {courses.length > 0 && <Link href="/app/cursos" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-[#0E5B5C] hover:text-[#004F4D]">Ver biblioteca <ChevronRight className="h-4 w-4" /></Link>}
      </div>

      {courses.length === 0 ? (
        <div className="amf-widget flex flex-col items-center justify-center rounded-[20px] border border-[#DED5C9] bg-white p-6 text-center shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF7F1]"><GraduationCap className="h-6 w-6 text-[#78664E]" /></div>
          <h3 className="mb-2 text-lg font-semibold text-[#16051F]">Sua biblioteca está pronta</h3>
          <p className="mb-6 max-w-sm text-sm text-[#667085]">Quando você tiver acesso a um curso, ele aparecerá aqui com seu progresso.</p>
          <Link href="/app/cursos" className="amf-action rounded-full bg-[#0E5B5C] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004F4D]">Explorar cursos</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map(course => {
            const progress = Math.max(0, Math.min(100, Math.round(course.progressPercent || 0)));
            const destination = `/app/cursos/${encodeURIComponent(course.courseSlug)}${course.lastLessonSlug ? `/aula/${encodeURIComponent(course.lastLessonSlug)}` : ''}`;
            const status = course.status === 'completed' ? 'Curso concluído' : course.status === 'in_progress' ? 'Continuar curso' : 'Começar curso';
            const action = course.status === 'completed' ? 'Rever curso' : course.status === 'in_progress' ? 'Continuar' : 'Começar';
            const StatusIcon = course.status === 'completed' ? Award : course.status === 'in_progress' ? BookOpen : PlayCircle;
            return (
              <li key={course.courseId}>
                <article className="amf-widget h-full overflow-hidden rounded-[20px] border border-[#DED5C9] bg-white shadow-sm transition-shadow hover:shadow-md">
                  {course.coverUrl ? <Image src={course.coverUrl} alt="" width={1280} height={720} unoptimized className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center bg-[#F1E8D9] text-[#0E5B5C]"><GraduationCap className="h-10 w-10" aria-hidden="true" /></div>}
                  <div className="p-5">
                    <div className="mb-3 flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAF7F1] text-[#0E5B5C]"><StatusIcon className="h-5 w-5" aria-hidden="true" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E5B5C]">{status}</p>
                        <h3 className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-[#16051F]">{course.courseTitle}</h3>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-[#667085]">{course.lastLessonTitle || 'Pronto para iniciar'}</span>
                        <span className="shrink-0 font-bold text-[#0E5B5C]">{progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#FAF7F1]" role="progressbar" aria-label={`Progresso em ${course.courseTitle}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-[#0E5B5C] transition-[width]" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <Link href={destination} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0E5B5C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004F4D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E5B5C]">
                      {action}<ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
