import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { determineAccessState, getUserEntitlements } from '@/lib/services/access';
import { Paywall } from '@/components/ui/paywall';

// Mock data (in production, fetch from Supabase joining courses, modules, lessons, and lesson_progress)
async function getCourseDetails(slug: string) {
  if (slug !== 'imersao-parte-1') return null;
  
  return {
    id: 'ccccccc1-0000-0000-0000-000000000000',
    product_id: '22222222-2222-2222-2222-222222222222',
    title: 'Imersão Clínica de Felinos — Parte 1',
    description: 'Curso completo cobrindo os principais desafios do atendimento inicial de felinos, triagem, manejo cat-friendly, fluidoterapia e emergências.',
    cover_url: '/images/imersao-p1.jpg',
    instructor: 'Dra. Polyana',
    duration_hours: 20,
    certificate_enabled: true,
    min_completion_percent: 90,
    modules: [
      {
        id: 'mmmmm001-0000-0000-0000-000000000000',
        title: 'Módulo 1: O Início de Tudo',
        description: 'Princípios básicos e manejo.',
        lessons: [
          { id: 'lllllll1-0000-0000-0000-000000000000', title: 'Aula 1: A Abordagem Cat Friendly', slug: 'abordagem-cat-friendly', duration_seconds: 1200, is_completed: true },
          { id: 'lllllll2-0000-0000-0000-000000000000', title: 'Aula 2: Semiologia Felina', slug: 'semiologia-felina', duration_seconds: 1800, is_completed: false },
        ]
      },
      {
        id: 'mmmmm002-0000-0000-0000-000000000000',
        title: 'Módulo 2: Casos Clínicos',
        description: 'Discussões reais.',
        lessons: [
          { id: 'lllllll3-0000-0000-0000-000000000000', title: 'Aula 3: Desidratação', slug: 'desidratacao', duration_seconds: 2100, is_completed: false },
          { id: 'lllllll4-0000-0000-0000-000000000000', title: 'Aula 4: Fluidoterapia na prática', slug: 'fluidoterapia', duration_seconds: 2500, is_completed: false },
        ]
      }
    ]
  };
}

export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const course = await getCourseDetails(courseSlug);
  
  if (!course) {
    notFound();
  }

  const userId = '00000000-0000-0000-0000-000000000000';
  const entitlements = await getUserEntitlements(userId);
  const accessState = determineAccessState(entitlements, course.product_id);
  const hasAccess = accessState === 'available';

  // Cálculos de UI
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.is_completed).length, 0);
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  // Determinar "Próxima Aula" ou aula atual.
  let nextLesson = null;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!lesson.is_completed && !nextLesson) {
        nextLesson = lesson;
        break;
      }
    }
    if (nextLesson) break;
  }
  // Se tudo completo, volta pra 1a
  if (!nextLesson && course.modules.length > 0 && course.modules[0].lessons.length > 0) {
    nextLesson = course.modules[0].lessons[0];
  }

  return (
    <div className="flex flex-col max-w-5xl mx-auto gap-8 pb-12">
      {/* Header do Curso */}
      <div className="flex flex-col md:flex-row gap-6 bg-white p-6 md:p-8 rounded-2xl border border-(--color-amf-border) shadow-sm">
        <div className="w-full md:w-1/3 h-48 md:h-auto bg-gray-200 rounded-xl relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-(--color-amf-purple) opacity-20"></div>
          {/* Se a imagem real estiver no public/images usaria img, por agora placeholder visual */}
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-editorial font-bold text-(--color-amf-plum) mb-2">{course.title}</h1>
          <p className="text-(--color-amf-muted) mb-4 line-clamp-3">{course.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-(--color-amf-foreground) font-medium mb-6">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{course.duration_hours}h</span>
            </div>
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              <span>{totalLessons} aulas</span>
            </div>
          </div>

          {hasAccess && (
            <div className="flex items-center gap-4">
              {nextLesson && (
                <Link 
                  href={`/app/cursos/${courseSlug}/aula/${nextLesson.slug}`}
                  className="bg-(--color-amf-plum) text-white px-6 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                  {completedLessons > 0 ? 'Continuar curso' : 'Iniciar curso'}
                </Link>
              )}
              {progressPercent > 0 && (
                <div className="flex-1 max-w-[200px]">
                  <div className="flex justify-between text-xs font-bold text-(--color-amf-teal-dark) mb-1">
                    <span>Progresso</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-(--color-amf-teal) rounded-full" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!hasAccess ? (
        <Paywall 
          title="Conteúdo Exclusivo"
          description="Para acessar as aulas e materiais deste curso, garanta sua inscrição ou assinatura."
          themeColor="var(--color-amf-purple)"
          ctaText="Ver Opções de Acesso"
          ctaUrl={`/app/produtos/${courseSlug}`}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Grade Curricular */}
          <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-(--color-amf-teal-dark) mb-2">Grade Curricular</h2>
            {course.modules.map((mod, i) => (
              <details key={mod.id} className="group bg-white border border-(--color-amf-border) rounded-xl overflow-hidden shadow-sm" open={i === 0}>
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-bold text-(--color-amf-plum) hover:bg-gray-50">
                  <div>
                    {mod.title}
                    <div className="text-xs font-normal text-(--color-amf-muted) mt-0.5">{mod.lessons.length} aulas</div>
                  </div>
                  <svg className="w-5 h-5 text-(--color-amf-muted) group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="border-t border-(--color-amf-border) bg-gray-50/50">
                  {mod.lessons.map((lesson, idx) => (
                    <Link 
                      key={lesson.id} 
                      href={`/app/cursos/${courseSlug}/aula/${lesson.slug}`}
                      className="flex items-center gap-4 p-4 border-b border-(--color-amf-border) last:border-0 hover:bg-white transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${lesson.is_completed ? 'bg-(--color-amf-teal) border-(--color-amf-teal) text-white' : 'border-gray-300 text-gray-400'}`}>
                        {lesson.is_completed ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${lesson.is_completed ? 'text-(--color-amf-teal-dark)' : 'text-(--color-amf-foreground)'}`}>
                          {lesson.title}
                        </div>
                        <div className="text-xs text-(--color-amf-muted)">
                          {Math.round(lesson.duration_seconds / 60)} min
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white border border-(--color-amf-border) flex items-center justify-center text-(--color-amf-muted) shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            {course.certificate_enabled && (
              <div className="bg-(--color-amf-plum) p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 15l-4.224 2.22a.5.5 0 0 1-.726-.528l.808-4.704-3.418-3.33a.5.5 0 0 1 .277-.853l4.723-.687 2.112-4.28a.5.5 0 0 1 .896 0l2.112 4.28 4.723.687a.5.5 0 0 1 .277.853l-3.418 3.33.808 4.704a.5.5 0 0 1-.726.528L12 15z"/></svg>
                </div>
                <h3 className="font-bold font-editorial text-xl text-(--color-amf-gold) mb-2">Certificado de Conclusão</h3>
                <p className="text-sm text-white/80 mb-6 relative z-10">Conclua ao menos {course.min_completion_percent}% das aulas para emitir seu certificado autenticado.</p>
                {progressPercent >= course.min_completion_percent ? (
                  <Link href={`/app/certificados/preview-${course.id}`} className="block text-center w-full bg-(--color-amf-gold) text-(--color-amf-plum) py-2.5 rounded-md font-bold text-sm relative z-10">
                    Emitir Certificado
                  </Link>
                ) : (
                  <button disabled className="w-full bg-white/10 text-white/50 cursor-not-allowed py-2.5 rounded-md font-medium text-sm relative z-10">
                    Atingir Progresso
                  </button>
                )}
              </div>
            )}

            <div className="bg-white border border-(--color-amf-border) p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-(--color-amf-teal-dark) mb-4">Materiais do Curso</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-(--color-amf-muted)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-(--color-amf-foreground)">Apostila Completa P1</div>
                    <div className="text-xs text-(--color-amf-muted)">PDF • 4.2 MB</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
