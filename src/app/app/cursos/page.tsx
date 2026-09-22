import React from 'react';
import { trackEvent } from '@/lib/services/analytics';
import type { CourseLibraryItem } from '@/lib/models/courses';
import { CoursesLibraryClient } from './courses-library-client';
import { createClient } from '@/lib/supabase/server';
import { getPlanilhaAccess, PLANILHA_PRODUCT_ID } from '@/lib/products/planilha-access';

export default async function Catalog() {
  const supabase = await createClient();
  const [{ data: { user } }, planilhaAccess] = await Promise.all([
    supabase.auth.getUser(),
    getPlanilhaAccess(),
  ]);
  const userId = user?.id || 'anonymous';

  trackEvent('catalog_viewed', { userId });

  // 1. Fetch ALL published courses
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      short_description,
      status,
      workload,
      all_students,
      thumbnail_url,
      media_assets!cover_asset_id(file_path)
    `)
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching courses:', error);
  }

  // 2. Fetch User Entitlements and Progress if logged in
  let entitlements: any[] = [];
  let progresses: any[] = [];

  if (user) {
    const [{ data: ent }, { data: prog }] = await Promise.all([
      supabase
        .from('entitlements')
        .select('resource_id,starts_at,expires_at')
        .eq('profile_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('lesson_progress')
        .select('course_id, progress_percent, status')
        .eq('profile_id', user.id),
    ]);

    entitlements = (ent || []).filter(
      e =>
        (!e.starts_at || new Date(e.starts_at).getTime() <= Date.now()) &&
        (!e.expires_at || new Date(e.expires_at).getTime() > Date.now())
    );
    progresses = prog || [];
  }

  const entitlementSet = new Set(entitlements.map(e => e.resource_id));

  const products: CourseLibraryItem[] = (courses || []).map(course => {
    const courseProgress = progresses.find(p => p.course_id === course.id);
    let accessState: 'locked' | 'unlocked' | 'in_progress' | 'active_subscription' = 'locked';

    if ((user && course.all_students) || entitlementSet.has(course.id)) {
      accessState = 'unlocked';
      if (courseProgress && courseProgress.status === 'in_progress') {
        accessState = 'in_progress';
      }
    }

    const coverPath =
      course.thumbnail_url ||
      (Array.isArray(course.media_assets)
        ? course.media_assets[0]?.file_path
        : (course.media_assets as any)?.file_path) ||
      '/assets/amf-casos/hero/hero-obstrucao-uretral.webp';
    const coverUrl =
      coverPath && !coverPath.startsWith('/') && !coverPath.startsWith('https://')
        ? supabase.storage.from('public_media').getPublicUrl(coverPath).data.publicUrl
        : coverPath;

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.short_description || '',
      productType: 'course',
      level: 'Todos',
      moduleCount: 0,
      coverUrl,
      accessState,
      progressPercent: courseProgress?.progress_percent || 0,
      destinationUrl: `/app/cursos/${course.slug}`,
      isPublished: true,
    };
  });

  const isPlanilhaUnlocked = planilhaAccess.state === 'available';

  const planilhaItem: CourseLibraryItem = {
    id: PLANILHA_PRODUCT_ID,
    slug: 'planilha-doses-seguras-felinos',
    title: 'Calculadora de Doses Seguras para Felinos',
    description: 'Calculadora clínica interativa e planilha Excel — Dra. Polyana',
    productType: 'bundle',
    specialty: 'Terapêutica',
    coverUrl: '/assets/amf-home/banner-planilha-felinos.jpeg',
    accessState: isPlanilhaUnlocked ? 'unlocked' : 'locked',
    destinationUrl: isPlanilhaUnlocked
      ? '/app/produtos/planilha-doses-seguras-felinos/calculadora'
      : '/app/produtos/planilha-doses-seguras-felinos',
    isPublished: true,
  };

  products.push(planilhaItem);

  return <CoursesLibraryClient products={products} />;
}
