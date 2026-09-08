'use server';

import { trackEvent } from './analytics';
import { createClient } from '@/lib/supabase/server';

export interface LessonProgress {
  id?: string;
  profile_id: string;
  lesson_id: string;
  is_completed: boolean;
  last_position_seconds: number;
  total_watch_time: number;
  first_accessed_at: string;
  completed_at?: string;
  completed_by?: 'auto' | 'manual';
}

export interface UpdateProgressResult {
  success: boolean;
  is_completed: boolean;
  progress_percent: number;
  last_position_seconds: number;
}

export async function updateSecureProgress(
  userId: string,
  lessonId: string,
  positionSeconds: number,
  clientDurationSeconds?: number,
  isEnded?: boolean
): Promise<UpdateProgressResult> {
  const supabase = await createClient();

  // 1. Get lesson and course context
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, duration_seconds, module_id, video_asset_id, course_modules(course_id)')
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson || !lesson.course_modules) {
    throw new Error('Lesson not found');
  }

  const courseModuleData = Array.isArray(lesson.course_modules) ? lesson.course_modules[0] : lesson.course_modules;
  const courseId = (courseModuleData as any)?.course_id;
  if (!courseId) {
    throw new Error('Course context not found');
  }

  // 2. Fetch authoritative duration
  let authoritativeDuration = lesson.duration_seconds || 0;
  if (lesson.video_asset_id) {
    const videoQuery: any = supabase
      .from('video_assets')
      .select('duration_seconds')
      .eq('id', lesson.video_asset_id);
    
    const { data: videoAsset } = typeof videoQuery.maybeSingle === 'function'
      ? await videoQuery.maybeSingle()
      : await videoQuery.single().catch(() => ({ data: null }));

    if (videoAsset?.duration_seconds && videoAsset.duration_seconds > 0) {
      authoritativeDuration = videoAsset.duration_seconds;
    }
  }

  if (authoritativeDuration === 0 && clientDurationSeconds && clientDurationSeconds > 0) {
    authoritativeDuration = clientDurationSeconds;
  }

  // 3. Fetch existing progress to ensure monotonicity
  const progressQuery: any = supabase
    .from('lesson_progress')
    .select('last_position_seconds, progress_percent, is_completed, first_started_at')
    .eq('profile_id', userId)
    .eq('lesson_id', lessonId);

  const { data: existingProgress } = typeof progressQuery.maybeSingle === 'function'
    ? await progressQuery.maybeSingle()
    : await progressQuery.single().catch(() => ({ data: null }));

  const prevCompleted = existingProgress?.is_completed || false;
  const prevPosition = existingProgress?.last_position_seconds || 0;
  const prevPercent = existingProgress?.progress_percent || 0;

  // Monotonic position & progress percentage
  const newPosition = Math.max(prevPosition, positionSeconds);

  let calculatedPercent = 0;
  if (authoritativeDuration > 0) {
    calculatedPercent = Math.min(100, (newPosition / authoritativeDuration) * 100);
  } else if (isEnded) {
    calculatedPercent = 100;
  }

  let newPercent = Math.max(prevPercent, calculatedPercent);
  let newCompleted = prevCompleted;

  // Auto-completion at >= 90% or ended
  if (newPercent >= 90 || isEnded) {
    newCompleted = true;
    newPercent = 100;
  }

  const now = new Date().toISOString();

  // 4. Idempotent upsert
  const savedProgress = await supabase.from('lesson_progress').upsert({
    profile_id: userId,
    lesson_id: lessonId,
    course_id: courseId,
    module_id: lesson.module_id,
    last_position_seconds: newPosition,
    progress_percent: newPercent,
    is_completed: newCompleted,
    status: newCompleted ? 'completed' : (newPercent > 0 ? 'in_progress' : 'not_started'),
    first_started_at: existingProgress?.first_started_at || now,
    completed_at: (newCompleted && !prevCompleted) ? now : undefined,
    updated_at: now
  }, {
    onConflict: 'profile_id,lesson_id'
  });
  if (savedProgress?.error) throw new Error('Não foi possível salvar o progresso.');

  trackEvent('video_progress', { userId, lessonId, positionSeconds: newPosition, percent: newPercent });

  if (newCompleted && !prevCompleted) {
    trackEvent('lesson_completed', { userId, lessonId, method: isEnded ? 'auto_ended' : 'auto_threshold' });
    await checkAndIssueCertificate(userId, courseId);
  }

  return {
    success: true,
    is_completed: newCompleted,
    progress_percent: newPercent,
    last_position_seconds: newPosition,
  };
}

export async function saveProgress(
  userId: string, 
  lessonId: string, 
  positionSeconds: number, 
  deltaSeconds: number
): Promise<void> {
  await updateSecureProgress(userId, lessonId, positionSeconds);
}

export async function markAsCompleted(
  userId: string, 
  lessonId: string, 
  isAuto: boolean = true
): Promise<void> {
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, module_id, course_modules(course_id)')
    .eq('id', lessonId)
    .single();

  if (!lesson || !lesson.course_modules) return;
  const courseModuleData = Array.isArray(lesson.course_modules) ? lesson.course_modules[0] : lesson.course_modules;
  const courseId = (courseModuleData as any)?.course_id;
  if (!courseId) return;

  await supabase.from('lesson_progress').upsert({
    profile_id: userId,
    lesson_id: lessonId,
    course_id: courseId,
    module_id: lesson.module_id,
    is_completed: true,
    progress_percent: 100,
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'profile_id,lesson_id'
  });

  trackEvent('lesson_completed', { userId, lessonId, method: isAuto ? 'auto' : 'manual' });

  // Check for course completion to issue certificate
  await checkAndIssueCertificate(userId, courseId);
}

async function checkAndIssueCertificate(userId: string, courseId: string) {
  const supabase = await createClient();

  // 1. Get Course to see if certificate is enabled
  const { data: course } = await supabase
    .from('courses')
    .select('title, certificate_enabled')
    .eq('id', courseId)
    .single();
    
  if (!course || !course.certificate_enabled) return;

  // 2. Check if all mandatory video lessons are completed
  const { data: allMandatory } = await supabase
    .from('lessons')
    .select('id, course_modules!inner(course_id)')
    .eq('course_modules.course_id', courseId)
    .eq('type', 'video')
    .eq('is_mandatory', true);

  if (!allMandatory || allMandatory.length === 0) return;

  const { data: progresses } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('profile_id', userId)
    .in('lesson_id', allMandatory.map(l => l.id));

  const completedCount = progresses?.filter(p => p.is_completed).length || 0;

  if (completedCount === allMandatory.length) {
    // 3. Issue certificate if it doesn't exist
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('profile_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!existing) {
      const validationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await supabase.from('certificates').insert({
        profile_id: userId,
        course_id: courseId,
        title: course.title,
        validation_code: validationCode,
        status: 'active'
      });
    }
  }
}

export async function getProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('profile_id', userId)
    .eq('lesson_id', lessonId)
    .single();
    
  return data as LessonProgress;
}
