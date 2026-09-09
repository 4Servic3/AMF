import React from 'react';
import { trackEvent } from '@/lib/services/analytics';
import { CourseLibraryItem } from '@/lib/models/courses';
import { CoursesLibraryClient } from './courses-library-client';
import { createClient } from '@/lib/supabase/server';

export default async function Catalog() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anonymous';
  
  // Track catalog viewed (only runs on server in some setups, but usually trackEvent should be client-side if it interacts with browser, 
  // but if it's a server action, it's fine. We leave it as is).
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
    const { data: ent } = await supabase
      .from('entitlements')
      .select('resource_id')
      .eq('profile_id', user.id)
      .eq('status', 'active');
      // ideally check expires_at, etc.
    entitlements = ent || [];

    const { data: prog } = await supabase
      .from('lesson_progress')
      .select('course_id, progress_percent, status')
      .eq('profile_id', user.id);
    progresses = prog || [];
  }

  const entitlementSet = new Set(entitlements.map(e => e.resource_id));

  const products: CourseLibraryItem[] = (courses || []).map(course => {
    // Find progress if any
    const courseProgress = progresses.find(p => p.course_id === course.id);
    let accessState: 'locked' | 'unlocked' | 'in_progress' | 'active_subscription' = 'locked';
    
    if (entitlementSet.has(course.id)) {
      accessState = 'unlocked';
      if (courseProgress && courseProgress.status === 'in_progress') {
        accessState = 'in_progress';
      }
    }

    // Default covers or specific if media_asset exists
    // The query above aliases media_assets to 'media_assets' or it might be an array.
    const coverPath = Array.isArray(course.media_assets)
      ? course.media_assets[0]?.file_path 
      : (course.media_assets as any)?.file_path || '/assets/amf-casos/hero/hero-obstrucao-uretral.webp';
    const coverUrl = coverPath && !coverPath.startsWith('/') && !coverPath.startsWith('https://')
      ? supabase.storage.from('public_media').getPublicUrl(coverPath).data.publicUrl : coverPath;

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.short_description || '',
      productType: 'course',
      level: 'Todos', // Placeholder
      moduleCount: 0, // Placeholder
      coverUrl,
      accessState,
      progressPercent: courseProgress?.progress_percent || 0,
      destinationUrl: `/app/cursos/${course.slug}`,
      isPublished: true
    };
  });

  return <CoursesLibraryClient products={products} />;
}
