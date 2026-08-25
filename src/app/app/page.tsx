import React from 'react';
import { trackEvent } from '@/lib/services/analytics';
import { createClient } from '@/lib/supabase/server';
import { PremiumHomeHeader } from '@/components/home/premium-home-header';
import { WelcomeBanner } from '@/components/home/welcome-banner';
import { SuaAcademia, type UserCourseProgress } from '@/components/home/sua-academia';

export default async function AppHome() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    trackEvent('home_viewed', { userId: session.user.id });
  }

  // 1. Fetch Banner
  const { data: banners } = await supabase
    .from('home_banners')
    .select('*')
    .eq('status', 'published')
    .order('position', { ascending: true })
    .limit(1);

  // 2. Fetch User Courses with REAL Progress
  let courses: UserCourseProgress[] = [];
  let materialsCount = 0;

  if (session) {
    // Pegamos os cursos que o usuário tem acesso
    const { data: entitlements } = await supabase
      .from('entitlements')
      .select('resource_id')
      .eq('profile_id', session.user.id)
      .eq('resource_type', 'course')
      .eq('status', 'active');
      
    const courseIds = (entitlements || []).map(e => e.resource_id);

    if (courseIds.length > 0) {
      // Pegar o progresso real atualizado por último
      const { data: progresses } = await supabase
        .from('lesson_progress')
        .select(`
          course_id,
          lesson_id,
          progress_percent,
          is_completed,
          updated_at,
          courses!inner ( title, slug ),
          lessons!inner ( title, slug )
        `)
        .eq('profile_id', session.user.id)
        .in('course_id', courseIds)
        .order('updated_at', { ascending: false });

      const courseMap = new Map<string, UserCourseProgress>();

      // Popula o map com o progresso mais recente de cada curso
      (progresses || []).forEach((prog: any) => {
        if (!courseMap.has(prog.course_id)) {
          // Precisamos calcular a % total real se baseando no histórico.
          // Mas como os writes do client já limitam progress_percent, pegamos as médias.
          courseMap.set(prog.course_id, {
            courseId: prog.course_id,
            courseTitle: prog.courses.title,
            courseSlug: prog.courses.slug,
            lastLessonTitle: prog.lessons.title,
            lastLessonSlug: prog.lessons.slug, // Using slug or ID
            progressPercent: prog.progress_percent || 0, // Simplified for MVP (in reality needs sum of all lessons / total lessons)
            status: prog.is_completed ? 'completed' : 'in_progress',
          });
        }
      });

      // E os cursos que tem acesso mas nunca começou?
      for (const cid of courseIds) {
        if (!courseMap.has(cid)) {
          // Fetch course metadata
          const { data: c } = await supabase.from('courses').select('title, slug').eq('id', cid).single();
          if (c) {
            courseMap.set(cid, {
              courseId: cid,
              courseTitle: c.title,
              courseSlug: c.slug,
              progressPercent: 0,
              status: 'not_started'
            });
          }
        }
      }

      // Converte map para array e ordena (em andamento primeiro, recém atualizados)
      courses = Array.from(courseMap.values()).sort((a, b) => {
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
        return 0;
      });
    }

    const { count } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', session.user.id)
      .eq('type', 'material');
      
    materialsCount = count || 0;
  }

  return (
    <div className="premium-home flex flex-col w-full min-h-[100dvh] bg-[#FAF7F1] min-w-0 max-w-full">
      <PremiumHomeHeader>
        <div />
      </PremiumHomeHeader>

      <div className="home-content-container max-w-[1240px] mx-auto w-full flex-1 flex flex-col pt-0">
        <div className="flex flex-col relative z-10 w-full min-w-0 max-w-full mt-3 sm:mt-4">
          
          {banners && banners.length > 0 ? (
            <WelcomeBanner 
              imageUrl={banners[0].media_asset_id ? `/api/media/${banners[0].media_asset_id}` : '/assets/amf-home/banner-imersao-felinos.png'}
              href={banners[0].cta_target_id ? `/app/cursos/${banners[0].cta_target_id}` : undefined}
            />
          ) : (
            <WelcomeBanner 
              imageUrl="/assets/amf-home/banner-imersao-felinos.png"
            />
          )}

        </div>

        <div className="mt-8 w-full min-w-0 max-w-full lg:max-w-[768px] mx-auto pb-8">
          <SuaAcademia courses={courses} materialsCount={materialsCount} />
        </div>
      </div>
    </div>
  );
}
