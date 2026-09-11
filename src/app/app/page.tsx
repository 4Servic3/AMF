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
      .select('resource_id,starts_at,expires_at')
      .eq('profile_id', session.user.id)
      .eq('resource_type', 'course')
      .eq('status', 'active');
      
    const { data: openCourses } = await supabase.from('courses').select('id').eq('all_students', true).eq('status', 'published');
    const courseIds = [...new Set([...(entitlements || []).filter(e => (!e.starts_at || new Date(e.starts_at).getTime() <= Date.now()) && (!e.expires_at || new Date(e.expires_at).getTime() > Date.now())).map(e => e.resource_id), ...(openCourses || []).map(c => c.id)])];

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

      // Agrupar progressos por curso e calcular % real baseada nas aulas obrigatórias
      const courseMap = new Map<string, UserCourseProgress>();
      const progressesByCourse = (progresses || []).reduce((acc: any, prog: any) => {
        if (!acc[prog.course_id]) acc[prog.course_id] = [];
        acc[prog.course_id].push(prog);
        return acc;
      }, {});

      for (const courseId of courseIds) {
        // Pegar total de aulas de video obrigatorias do curso
        const { data: mandatoryLessons } = await supabase
          .from('lessons')
          .select('id, module_id, course_modules!inner(course_id)')
          .eq('course_modules.course_id', courseId)
          .eq('type', 'video')
          .eq('is_mandatory', true);
          
        const totalMandatory = mandatoryLessons?.length || 1; // fallback para 1 se não houver
        const courseProgresses = progressesByCourse[courseId] || [];
        
        let sumPercent = 0;
        let completedCount = 0;
        let lastLessonTitle = undefined;
        let lastLessonSlug = undefined;

        if (courseProgresses.length > 0) {
          lastLessonTitle = courseProgresses[0].lessons.title;
          lastLessonSlug = courseProgresses[0].lessons.slug;
          
          mandatoryLessons?.forEach(ml => {
            const lp = courseProgresses.find((p: any) => p.lesson_id === ml.id);
            if (lp) {
              sumPercent += Number(lp.progress_percent || 0);
              if (lp.is_completed) completedCount++;
            }
          });
        }
        
        const realProgressPercent = mandatoryLessons && mandatoryLessons.length > 0 
          ? Math.min(100, Math.round(sumPercent / totalMandatory))
          : 0;
          
        const isCompleted = mandatoryLessons && mandatoryLessons.length > 0 && completedCount === totalMandatory;

        const { data: c } = await supabase.from('courses').select('title, slug, thumbnail_url').eq('status', 'published').eq('id', courseId).single();
        if (c) {
          courseMap.set(courseId, {
            courseId: courseId,
            courseTitle: c.title,
            courseSlug: c.slug,
            coverUrl: c.thumbnail_url,
            lastLessonTitle: lastLessonTitle,
            lastLessonSlug: lastLessonSlug,
            progressPercent: realProgressPercent,
            status: isCompleted ? 'completed' : (realProgressPercent > 0 ? 'in_progress' : 'not_started')
          });
        }
      }

      // E os cursos que tem acesso mas nunca começou?
      for (const cid of courseIds) {
        if (!courseMap.has(cid)) {
          // Fetch course metadata
          const { data: c } = await supabase.from('courses').select('title, slug, thumbnail_url').eq('status', 'published').eq('id', cid).single();
          if (c) {
            courseMap.set(cid, {
              courseId: cid,
              courseTitle: c.title,
              courseSlug: c.slug,
            coverUrl: c.thumbnail_url,
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
