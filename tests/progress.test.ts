import { describe, it, expect, vi } from 'vitest';
import { getProgress, saveProgress, markAsCompleted, updateSecureProgress } from '../src/lib/services/progress';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === 'lesson_progress') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => ({
            eq: vi.fn().mockImplementation((col2: string, val2: string) => ({
              single: vi.fn().mockResolvedValue({
                data: val2 === 'lllllll1-0000-0000-0000-000000000000' ? {
                  profile_id: val,
                  lesson_id: val2,
                  is_completed: true,
                  last_position_seconds: 120,
                  total_watch_time: 120,
                  first_accessed_at: new Date().toISOString()
                } : null,
                error: null
              }),
              in: vi.fn().mockReturnThis(),
            })),
            in: vi.fn().mockResolvedValue({ data: [], error: null })
          })),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === 'lessons') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'lesson123',
              duration_seconds: 300,
              module_id: 'mod123',
              course_modules: { course_id: 'course123' }
            },
            error: null
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null })
      };
    })
  }))
}));

describe('Progress Service', () => {
  it('should fetch mock progress for known lesson', async () => {
    const progress = await getProgress('user123', 'lllllll1-0000-0000-0000-000000000000');
    expect(progress).not.toBeNull();
    expect(progress?.is_completed).toBe(true);
  });

  it('should return null for unknown lesson', async () => {
    const progress = await getProgress('user123', 'unknown-lesson');
    expect(progress).toBeNull();
  });

  it('saveProgress should not throw error', async () => {
    await expect(saveProgress('user123', 'lesson123', 100, 10)).resolves.not.toThrow();
  });

  it('markAsCompleted should not throw error', async () => {
    await expect(markAsCompleted('user123', 'lesson123', true)).resolves.not.toThrow();
  });

  it('updateSecureProgress should calculate progress and return proper structure', async () => {
    const res = await updateSecureProgress('user123', 'lesson123', 150, 300);
    expect(res.success).toBe(true);
    expect(res.is_completed).toBe(false);
    expect(res.progress_percent).toBe(50);
    expect(res.last_position_seconds).toBe(150);
  });

  it('updateSecureProgress should auto-complete when reaching 90% threshold', async () => {
    const res = await updateSecureProgress('user123', 'lesson123', 275, 300);
    expect(res.success).toBe(true);
    expect(res.is_completed).toBe(true);
    expect(res.progress_percent).toBe(100);
  });
});
