import { trackEvent } from './analytics';

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

// Em produção, isso bateria no Supabase. Para o MVP de desenvolvimento, usaremos mocks ou rotas de API simuladas.
// Ideal: await supabase.from('lesson_progress').upsert(data)

export async function saveProgress(
  userId: string, 
  lessonId: string, 
  positionSeconds: number, 
  deltaSeconds: number
): Promise<void> {
  // Simulando idempotência e debounce.
  console.log(`[Progress] Salvando progresso para lesson ${lessonId} no segundo ${positionSeconds} (delta: ${deltaSeconds}s)`);
  trackEvent('video_progress', { userId, lessonId, positionSeconds });
}

export async function markAsCompleted(
  userId: string, 
  lessonId: string, 
  isAuto: boolean = true
): Promise<void> {
  console.log(`[Progress] Aula ${lessonId} marcada como concluída (${isAuto ? 'auto' : 'manual'})`);
  trackEvent('lesson_completed', { userId, lessonId, method: isAuto ? 'auto' : 'manual' });
}

export async function getProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  // Mock para desenvolvimento.
  if (lessonId === 'lllllll1-0000-0000-0000-000000000000') {
    return {
      profile_id: userId,
      lesson_id: lessonId,
      is_completed: true,
      last_position_seconds: 1200,
      total_watch_time: 1200,
      first_accessed_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      completed_by: 'auto'
    };
  }
  if (lessonId === 'lllllll2-0000-0000-0000-000000000000') {
    return {
      profile_id: userId,
      lesson_id: lessonId,
      is_completed: false,
      last_position_seconds: 450,
      total_watch_time: 450,
      first_accessed_at: new Date().toISOString()
    };
  }
  
  return null;
}
