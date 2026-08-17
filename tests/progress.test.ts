import { describe, it, expect, vi } from 'vitest';
import { getProgress, saveProgress, markAsCompleted } from '../src/lib/services/progress';

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
});
