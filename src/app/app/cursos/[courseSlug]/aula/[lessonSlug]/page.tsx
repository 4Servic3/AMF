import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Paywall } from '@/components/ui/paywall';
import { CoursePlayer } from '@/components/ui/course-player';
import { PdfViewer } from '@/components/ui/pdf-viewer';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export default async function LessonPage({ params }: { params: Promise<{ courseSlug: string, lessonSlug: string }> }) {
  const { courseSlug, lessonSlug } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch Course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, status')
    .eq('slug', courseSlug)
    .single();

  if (!course) notFound();

  // 2. Auth Check
  let hasAccess = false;
  if (user) {
    const { data: accessData } = await supabase.rpc('has_course_access', { course_uuid: course.id });
    hasAccess = !!accessData;
  }

  if (!hasAccess || !user) {
    return (
      <div className="max-w-4xl mx-auto pt-12">
        <Paywall 
          title="Conteúdo Bloqueado" 
          description="Você precisa possuir este curso para acessar a aula." 
          themeColor="#160820" 
          ctaText="Ver detalhes do curso" 
          ctaUrl={`/app/produtos/${courseSlug}`} 
        />
      </div>
    );
  }

  // 3. Fetch current lesson
  const { data: currentLesson } = await supabase
    .from('lessons')
    .select('*, course_modules!inner(course_id), lesson_materials(id)')
    .eq('id', lessonSlug)
    .single();

  if (!currentLesson || currentLesson.course_modules.course_id !== course.id) {
    notFound();
  }

  // 4. Fetch curriculum for sidebar
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: modulesData } = await supabaseAdmin
    .from('course_modules')
    .select(`
      id, title, order_index,
      lessons (
        id, title, type, duration_seconds, order_index, status
      )
    `)
    .eq('course_id', course.id)
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  const modules = (modulesData || []).map(mod => ({
    ...mod,
    lessons: (mod.lessons || [])
      .filter((l: any) => l.status === 'published' || l.status === 'coming_soon')
      .sort((a: any, b: any) => a.order_index - b.order_index)
  }));

  // Find next/prev lessons in the flattened array
  const allLessons = modules.flatMap(m => m.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === lessonSlug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // 5. Fetch External Resource if external_link
  let destinationUrl = null;
  if (currentLesson.type === 'external_link' && currentLesson.external_resource_id) {
    const { data: extRes } = await supabaseAdmin
      .from('external_resources')
      .select('private_destination_url')
      .eq('id', currentLesson.external_resource_id)
      .single();
    if (extRes && extRes.private_destination_url) {
      try {
        const urlObj = new URL(extRes.private_destination_url);
        if (urlObj.protocol === 'https:' && (urlObj.hostname === 'chat.whatsapp.com' || urlObj.hostname === 'wa.me')) {
          destinationUrl = extRes.private_destination_url;
        }
      } catch (e) {
        // Invalid URL
      }
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 mx-auto -mt-6 -mx-6 h-[calc(100vh-64px)] overflow-hidden bg-[#FAF7F1]">
      
      {/* Coluna Esquerda: Conteúdo */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto pb-24 xl:pb-0 relative">
        
        {/* Top Bar Navigation */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center gap-4 shrink-0">
          <Link href={`/app/cursos/${courseSlug}`} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-[#D4AD62] uppercase tracking-wider truncate">{course.title}</div>
            <h1 className="text-lg font-bold text-[#160820] truncate">{currentLesson.title}</h1>
          </div>
        </div>

        {/* Dynamic Content Area */}
        {currentLesson.type === 'video' ? (
          <div className="w-full bg-black">
            <CoursePlayer 
              userId={user.id} 
              lessonId={currentLesson.id} 
              videoId={currentLesson.video_asset_id || ''}
              courseSlug={courseSlug}
              initialPositionSeconds={0}
            />
          </div>
        ) : currentLesson.type === 'external_link' ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#FAF7F1]">
            <div className="bg-white max-w-lg w-full p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#0F6466]/10 rounded-full flex items-center justify-center text-[#0F6466] mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <h2 className="text-2xl font-bold font-editorial text-[#160820] mb-3">Grupo de network</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Acesse o grupo exclusivo para networking entre os participantes e médicos-veterinários da Imersão Clínica de Felinos.
              </p>
              
              <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wider">Você será direcionado ao WhatsApp em uma nova aba.</p>
              
              {destinationUrl ? (
                <>
                  <a 
                    href={destinationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-[#0F6466] text-white font-bold py-4 rounded-xl hover:bg-[#0c5052] transition-colors mb-6 flex items-center justify-center gap-2 shadow-sm ring-1 ring-inset ring-white/10"
                  >
                    Entrar
                  </a>
                  
                  <div className="text-sm text-gray-500 w-full text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="block text-xs font-bold text-gray-700 mb-1">Se o botão não abrir, toque no link:</span>
                    <a href={destinationUrl} target="_blank" rel="noopener noreferrer" className="text-[#D4AD62] hover:underline font-medium break-all">
                      {destinationUrl}
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-red-500 font-bold p-4 bg-red-50 rounded-lg w-full">Destino indisponível ou revogado. Contate o suporte.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full bg-[#FAF7F1] flex flex-col items-center">
             {currentLesson.lesson_materials && currentLesson.lesson_materials.length > 0 ? (
                <PdfViewer 
                  courseSlug={courseSlug}
                  materialId={currentLesson.lesson_materials[0].id}
                  title={currentLesson.title}
                />
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-6 w-full mt-24">
                 <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                  <h2 className="text-2xl font-bold text-[#160820] mb-3">{currentLesson.title}</h2>
                  <p className="text-gray-600 mb-6">Este material não possui um arquivo anexado no momento.</p>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* Lower Controls */}
        <div className="px-6 py-8 flex flex-col gap-8 max-w-4xl mx-auto w-full shrink-0">
          <div className="flex items-center justify-between">
            {prevLesson ? (
              <Link href={`/app/cursos/${courseSlug}/aula/${prevLesson.id}`} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#160820] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Anterior
              </Link>
            ) : <div></div>}
            
            {nextLesson ? (
              <Link href={`/app/cursos/${courseSlug}/aula/${nextLesson.id}`} className="flex items-center gap-2 text-sm font-bold bg-[#160820] text-white px-6 py-2.5 rounded-full hover:bg-[#2c1040] transition-colors shadow-sm">
                Próxima
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            ) : (
              <Link href={`/app/cursos/${courseSlug}`} className="flex items-center gap-2 text-sm font-bold bg-[#0F6466] text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                Concluir
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* Coluna Direita: Grade Curricular (Sidebar Desktop) */}
      <div className="hidden xl:flex w-[320px] bg-white border-l border-gray-200 flex-col h-full overflow-y-auto shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-[#160820]">Conteúdo do Curso</h2>
        </div>
        <div className="flex flex-col">
          {modules.map(mod => (
            <div key={mod.id} className="border-b border-gray-100 last:border-0">
              <div className="p-4 bg-[#FAF7F1]/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {mod.title}
              </div>
              <div className="flex flex-col">
                {mod.lessons.map(lesson => {
                  const isActive = lesson.id === lessonSlug;
                  const isComingSoon = lesson.status === 'coming_soon';
                  const isVideo = lesson.type === 'video';
                  
                  return (
                    <Link 
                      key={lesson.id} 
                      href={isComingSoon ? '#' : `/app/cursos/${courseSlug}/aula/${lesson.id}`}
                      className={`flex items-start gap-3 p-4 text-sm transition-colors ${isActive ? 'bg-[#D4AD62]/10 border-l-2 border-[#D4AD62]' : isComingSoon ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50 border-l-2 border-transparent'}`}
                    >
                      <div className="mt-0.5">
                        {isActive ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AD62" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        ) : isComingSoon ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold truncate ${isActive ? 'text-[#160820]' : 'text-gray-700'}`}>{lesson.title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {isComingSoon ? 'Em breve' : isVideo ? `${Math.round(lesson.duration_seconds / 60)} min` : lesson.type === 'external_link' ? 'Comunidade' : 'Material'}
                        </div>
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
