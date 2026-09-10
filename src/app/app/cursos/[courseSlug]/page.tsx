import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Paywall } from '@/components/ui/paywall';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Real query to get course and access
export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Buscamos o curso com RLS normal. Como o catálogo público é visível, courses vai retornar.
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id, title, slug, short_description, workload, instructor_id,
      thumbnail_url,
      media_assets!cover_asset_id(file_path),
      certificate_rule
    `)
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single();
    
  if (error || !course) {
    notFound();
  }

  // 2. Checar acesso
  let hasAccess = false;
  if (user) {
    const { data: accessData } = await supabase.rpc('has_course_access', { course_uuid: course.id });
    hasAccess = !!accessData;
  }

  // 3. Buscar estrutura e aulas
  // Se hasAccess for true, RLS já traria, mas se for false, não.
  // Vamos usar admin/service_role de forma pontual APENAS para buscar a "grade" (titulos, tempos) 
  // OMITINDO rigorosamente secrets (playback, url).
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: modulesData } = await supabaseAdmin
    .from('course_modules')
    .select(`
      id, title, description, order_index,
      lessons (
        id, title, type, duration_seconds, order_index, status,
        video_asset_id, external_resource_id
      )
    `)
    .eq('course_id', course.id)
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  const { data: materialsData } = await supabaseAdmin
    .from('lesson_materials')
    .select('id, name, mime_type, size_bytes')
    .eq('course_id', course.id)
    .eq('status', 'published');

  // Filtragem estrita de segurança e modelagem
  const modules = (modulesData || []).map(mod => ({
    ...mod,
    lessons: (mod.lessons || []).filter((l: any) => l.status === 'published' || l.status === 'coming_soon').sort((a: any, b: any) => a.order_index - b.order_index).map((l: any) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      status: l.status,
      duration_seconds: l.duration_seconds || 0,
      slug: l.id, // MVP: using ID as slug for routing
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

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 md:px-0 pt-8 pb-32">
      {/* Header do Curso */}
      <div className="flex flex-col md:flex-row gap-6 bg-white p-6 md:p-8 rounded-2xl border border-[rgba(224,193,126,0.4)] shadow-sm mb-8">
        <div className="w-full md:w-1/3 aspect-[4/3] md:h-auto bg-gray-100 rounded-xl relative overflow-hidden flex-shrink-0">
          <img src={coverUrl} alt={course.title} className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <Link href="/app/cursos" className="text-[11px] font-bold uppercase tracking-wider text-[#D4AD62] mb-3 hover:underline">
            ← Voltar para Cursos
          </Link>
          <h1 className="text-3xl md:text-4xl font-editorial font-bold text-[#160820] mb-3">{course.title}</h1>
          <p className="text-gray-600 mb-5 line-clamp-3 text-sm leading-relaxed">{course.short_description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium mb-6">
            {course.instructor_id && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md">
                <span className="font-bold text-gray-700">Equipe AMF</span>
              </div>
            )}
            {course.workload && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md">
                <span>{Math.round(course.workload / 60)}h</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md">
              <span>{totalLessons} itens</span>
            </div>
          </div>

          {hasAccess && (
            <div className="flex items-center gap-6 mt-auto">
              {nextLesson && (
                <Link 
                  href={`/app/cursos/${courseSlug}/aula/${nextLesson.slug}`}
                  className="bg-[#160820] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-[#2c1040] transition-colors shadow-md"
                >
                  {completedCount > 0 ? 'Continuar Curso' : 'Começar Agora'}
                </Link>
              )}
              {progressPercent > 0 && (
                <div className="flex-1 max-w-[200px]">
                  <div className="flex justify-between text-xs font-bold text-[#0F6466] mb-1.5">
                    <span>Progresso</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0F6466] rounded-full" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!hasAccess ? (
        <Paywall 
          title="Acesso Exclusivo"
          description="Para assistir às aulas e baixar os materiais restritos deste curso, garanta sua inscrição ou faça parte da assinatura premium."
          themeColor="#160820"
          ctaText="Ver Opções de Acesso"
          ctaUrl={`/app/produtos/${courseSlug}`}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Grade Curricular */}
          <div className="flex-1 flex flex-col gap-5">
            <h2 className="text-xl font-bold text-[#0F6466] mb-1">Grade Curricular</h2>
            {modules.map((mod, i) => (
              <details key={mod.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm" open={i === 0}>
                <summary className="flex items-center justify-between p-5 cursor-pointer select-none font-bold text-[#160820] hover:bg-[#FAF7F1] transition-colors">
                  <div>
                    {mod.title}
                    <div className="text-xs font-normal text-gray-500 mt-1">{mod.lessons.length} aulas</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="border-t border-gray-100 bg-[#FAF7F1]/30">
                  {mod.lessons.map((lesson: any, idx: number) => {
                    const isComingSoon = lesson.status === 'coming_soon';
                    const isVideo = lesson.type === 'video';
                    const isPdf = lesson.type === 'pdf_material';
                    const isExternal = lesson.type === 'external_link';
                    
                    const innerContent = (
                      <>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-[1.5px] flex-shrink-0 ${lesson.is_completed ? 'bg-[#0F6466] border-[#0F6466] text-white' : isComingSoon ? 'border-gray-300 text-gray-400' : 'border-[#D4AD62] text-[#D4AD62]'}`}>
                          {lesson.is_completed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          ) : isComingSoon ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          ) : (
                            <span className="text-[11px] font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-bold ${lesson.is_completed ? 'text-[#0F6466]' : isComingSoon ? 'text-gray-400' : 'text-[#160820]'}`}>
                            {lesson.title}
                          </div>
                          <div className="text-[11px] mt-0.5 text-gray-500">
                            {isComingSoon ? 'Em breve' : isVideo ? `${Math.round(lesson.duration_seconds / 60)} min` : isExternal ? 'Comunidade' : 'Material'}
                          </div>
                        </div>
                        {!isComingSoon && (
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#160820] shadow-sm group-hover/link:border-[#D4AD62] group-hover/link:text-[#D4AD62] transition-colors">
                            {isPdf ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            ) : isExternal ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            )}
                          </div>
                        )}
                      </>
                    );

                    if (isComingSoon) {
                      return (
                        <div key={lesson.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 bg-gray-50/50 cursor-not-allowed">
                          {innerContent}
                        </div>
                      );
                    }

                    return (
                      <Link 
                        key={lesson.id} 
                        href={`/app/cursos/${courseSlug}/aula/${lesson.slug}`}
                        className="group/link flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-white transition-colors cursor-pointer"
                      >
                        {innerContent}
                      </Link>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[320px] flex flex-col gap-6">
            {certificateEnabled && (
              <div className="bg-[#160820] p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
                <h3 className="font-bold font-editorial text-xl text-[#D4AD62] mb-2">Certificado</h3>
                <p className="text-xs text-white/80 mb-6 relative z-10 leading-relaxed">Conclua ao menos {minCompletion}% das aulas para emitir seu certificado autenticado.</p>
                {progressPercent >= minCompletion ? (
                  <Link href={`/app/certificados/preview-${course.id}`} className="block text-center w-full bg-[#D4AD62] text-[#160820] py-3 rounded-full font-bold text-sm relative z-10 transition-colors hover:bg-[#E0C17E]">
                    Emitir Certificado
                  </Link>
                ) : (
                  <button disabled className="w-full bg-white/5 text-white/40 cursor-not-allowed py-3 rounded-full font-bold text-sm relative z-10 border border-white/10">
                    Atingir Progresso
                  </button>
                )}
              </div>
            )}

            {materialsData && materialsData.length > 0 && (
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-[#0F6466] mb-4">Materiais</h3>
                <ul className="space-y-4">
                  {materialsData.map(mat => (
                    <li key={mat.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF7F1] flex items-center justify-center flex-shrink-0 text-[#160820]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#160820] truncate">{mat.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{mat.mime_type?.includes('pdf') ? 'PDF' : 'Arquivo'} • {mat.size_bytes ? Math.round(mat.size_bytes / 1024 / 1024) : 0} MB</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
