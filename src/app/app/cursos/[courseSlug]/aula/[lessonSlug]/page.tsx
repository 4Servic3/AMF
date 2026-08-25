import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { determineAccessState, getUserEntitlements } from '@/lib/services/access';
import { getProgress } from '@/lib/services/progress';
import { CoursePlayer } from '@/components/ui/course-player';
import { VideoNotes } from '@/components/ui/video-notes';
import { Paywall } from '@/components/ui/paywall';

// Mock DB Fetch
async function getCourseAndLesson(courseSlug: string, lessonSlug: string) {
  if (courseSlug !== 'imersao-parte-1' && courseSlug !== 'imersao-clinica-de-felinos-parte-1') return null;
  
  const course = {
    id: 'ccccccc1-0000-0000-0000-000000000000',
    product_id: '22222222-2222-2222-2222-222222222222',
    title: 'Imersão Clínica de Felinos — Parte 1',
    modules: [
      {
        id: 'mmmmm001-0000-0000-0000-000000000000',
        title: 'Módulo 1: O Início de Tudo',
        lessons: [
          { id: 'lllllll1-0000-0000-0000-000000000000', title: 'Aula 1: A Abordagem Cat Friendly', slug: 'abordagem-cat-friendly', duration_seconds: 1200, video_id: 'v_demo_1', description: 'Entenda os princípios fundamentais para tornar o ambiente da clínica seguro e receptivo para gatos.', materials: [{ title: 'Checklist Cat Friendly', url: '#', type: 'pdf' }] },
          { id: 'lllllll2-0000-0000-0000-000000000000', title: 'Aula 2: Semiologia Felina', slug: 'semiologia-felina', duration_seconds: 1800, video_id: 'v_demo_2', description: 'O exame físico detalhado no gato.', materials: [] },
        ]
      },
      {
        id: 'mmmmm002-0000-0000-0000-000000000000',
        title: 'Módulo 2: Casos Clínicos',
        lessons: [
          { id: 'lllllll3-0000-0000-0000-000000000000', title: 'Aula 3: Desidratação', slug: 'desidratacao', duration_seconds: 2100, video_id: 'v_demo_3', description: 'Diagnóstico.', materials: [] },
          { id: 'lllllll4-0000-0000-0000-000000000000', title: 'Aula 4: Fluidoterapia na prática', slug: 'fluidoterapia', duration_seconds: 2500, video_id: 'v_demo_4', description: 'Terapia.', materials: [] },
        ]
      }
    ]
  };

  let currentLesson = null;
  let prevLesson = null;
  let nextLesson = null;
  
  const allLessons = course.modules.flatMap(m => m.lessons);
  const currentIndex = allLessons.findIndex(l => l.slug === lessonSlug);
  
  if (currentIndex !== -1) {
    currentLesson = allLessons[currentIndex];
    prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  }

  if (!currentLesson) return null;

  return { course, currentLesson, prevLesson, nextLesson };
}

export default async function LessonPage({ params }: { params: { courseSlug: string, lessonSlug: string } }) {
  const { courseSlug, lessonSlug } = await params;
  const data = await getCourseAndLesson(courseSlug, lessonSlug);
  
  if (!data) {
    notFound();
  }

  const { course, currentLesson, prevLesson, nextLesson } = data;
  const userId = '00000000-0000-0000-0000-000000000000';
  
  // Auth Check
  const entitlements = await getUserEntitlements(userId);
  const accessState = determineAccessState(entitlements, course.product_id);
  const hasAccess = accessState === 'available';

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto pt-12">
        <Paywall 
          title="Conteúdo Bloqueado" 
          description="Você precisa possuir este curso para acessar a aula." 
          themeColor="var(--color-amf-purple)" 
          ctaText="Ver detalhes do curso" 
          ctaUrl={`/app/produtos/${courseSlug}`} 
        />
      </div>
    );
  }

  // Load Progress
  const progressData = await getProgress(userId, currentLesson.id);
  const initialPosition = progressData?.last_position_seconds || 0;

  return (
    <div className="flex flex-col xl:flex-row gap-6 mx-auto -mt-6 -mx-6 h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Coluna Esquerda: Vídeo e Conteúdo */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 pb-24 xl:pb-0">
        
        {/* Top Bar Navigation */}
        <div className="bg-white px-6 py-4 border-b border-(--color-amf-border) flex items-center gap-4">
          <Link href={`/app/cursos/${courseSlug}`} className="w-8 h-8 rounded-full border border-(--color-amf-border) flex items-center justify-center text-(--color-amf-muted) hover:bg-gray-50 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div className="flex-1">
            <div className="text-xs font-bold text-(--color-amf-purple) uppercase tracking-wider">{course.title}</div>
            <h1 className="text-xl font-bold text-(--color-amf-foreground) truncate">{currentLesson.title}</h1>
          </div>
        </div>

        {/* Player Section */}
        <div className="p-4 md:p-6 lg:px-12 bg-black">
          <CoursePlayer 
            userId={userId} 
            lessonId={currentLesson.id} 
            videoId={currentLesson.video_id}
            initialPositionSeconds={initialPosition} 
            courseSlug={courseSlug}
          />
        </div>

        {/* Lower Controls & Content */}
        <div className="px-6 py-6 lg:px-12 flex flex-col gap-8 max-w-4xl mx-auto w-full">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            {prevLesson ? (
              <Link href={`/app/cursos/${courseSlug}/aula/${prevLesson.slug}`} className="flex items-center gap-2 text-sm font-medium text-(--color-amf-muted) hover:text-(--color-amf-purple)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Aula Anterior
              </Link>
            ) : <div></div>}
            
            {nextLesson ? (
              <Link href={`/app/cursos/${courseSlug}/aula/${nextLesson.slug}`} className="flex items-center gap-2 text-sm font-medium bg-(--color-amf-plum) text-white px-4 py-2 rounded-full hover:opacity-90">
                Próxima Aula
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            ) : (
              <button className="flex items-center gap-2 text-sm font-medium bg-(--color-amf-teal) text-white px-4 py-2 rounded-full hover:opacity-90">
                Concluir Curso
              </button>
            )}
          </div>

          {/* Description & Materials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="font-bold text-(--color-amf-teal-dark) mb-2">Visão Geral da Aula</h3>
                <p className="text-(--color-amf-muted) leading-relaxed">
                  {currentLesson.description}
                </p>
              </div>

              {currentLesson.materials.length > 0 && (
                <div>
                  <h3 className="font-bold text-(--color-amf-teal-dark) mb-4">Anexos e Materiais</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {currentLesson.materials.map((mat, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-(--color-amf-border) rounded-lg bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-(--color-amf-muted)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          </div>
                          <span className="font-medium text-sm text-(--color-amf-foreground)">{mat.title}</span>
                        </div>
                        <button className="text-(--color-amf-teal) text-sm font-bold px-3 py-1 bg-(--color-amf-teal)/10 rounded-md">Baixar</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-1 h-[400px]">
              <VideoNotes userId={userId} lessonId={currentLesson.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Grade (Visível em Desktop, Recolhida em Mobile se necessário, mas no design desktop ela fica fixa) */}
      <div className="hidden xl:flex w-80 bg-white border-l border-(--color-amf-border) flex-col h-full overflow-y-auto shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10">
        <div className="p-4 border-b border-(--color-amf-border) sticky top-0 bg-white z-10">
          <h2 className="font-bold text-(--color-amf-plum)">Conteúdo do Curso</h2>
        </div>
        <div className="flex flex-col">
          {course.modules.map(mod => (
            <div key={mod.id} className="border-b border-(--color-amf-border) last:border-0">
              <div className="p-3 bg-gray-50 text-xs font-bold text-(--color-amf-muted) uppercase tracking-wider">
                {mod.title}
              </div>
              <div className="flex flex-col">
                {mod.lessons.map(lesson => {
                  const isActive = lesson.slug === lessonSlug;
                  return (
                    <Link 
                      key={lesson.id} 
                      href={`/app/cursos/${courseSlug}/aula/${lesson.slug}`}
                      className={`flex items-start gap-3 p-3 text-sm transition-colors ${isActive ? 'bg-(--color-amf-purple)/5 border-l-2 border-(--color-amf-purple)' : 'hover:bg-gray-50 border-l-2 border-transparent'}`}
                    >
                      <div className="mt-0.5 text-(--color-amf-muted)">
                        {isActive ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-amf-purple)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                        )}
                      </div>
                      <div>
                        <div className={`font-medium ${isActive ? 'text-(--color-amf-purple)' : 'text-(--color-amf-foreground)'}`}>{lesson.title}</div>
                        <div className="text-xs text-(--color-amf-muted) mt-1">{Math.round(lesson.duration_seconds / 60)} min</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
