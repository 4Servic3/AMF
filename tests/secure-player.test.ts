import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as progressHandler } from '../src/app/api/courses/lessons/[lessonId]/progress/route';
import { updateSecureProgress } from '../src/lib/services/progress';

// Mock validateRequestOrigin
vi.mock('@/lib/mux', async () => {
  const actual = await vi.importActual<any>('@/lib/mux');
  return {
    ...actual,
    validateRequestOrigin: vi.fn((req: Request) => {
      const origin = req.headers.get('origin');
      if (origin && origin.includes('malicious.com')) {
        return { allowed: false, reason: 'unauthorized_origin' };
      }
      return { allowed: true };
    }),
  };
});

// Mock Supabase
const mockGetUser = vi.fn();
const mockProfilesSelect = vi.fn();
const mockLessonsSelect = vi.fn();
const mockRpc = vi.fn();
const mockUpsert = vi.fn();
const mockLessonProgressSelect = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockProfilesSelect,
            }),
          }),
        };
      }
      if (table === 'lessons') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockLessonsSelect,
              maybeSingle: mockLessonsSelect,
            }),
          }),
        };
      }
      if (table === 'lesson_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockLessonProgressSelect,
                single: mockLessonProgressSelect,
              }),
            })),
          }),
          upsert: mockUpsert,
        };
      }
      if (table === 'video_assets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { duration_seconds: 300 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'courses' || table === 'certificates') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  })),
}));

describe('Secure Player & Progress API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests to /api/courses/lessons/[lessonId]/progress', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://amf-eight.vercel.app',
      },
      body: JSON.stringify({ position_seconds: 45 }),
    });

    const res = await progressHandler(req, {
      params: Promise.resolve({ lessonId: 'lesson-1' }),
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Autenticação necessária');
  });

  it('rejects requests from untrusted origins (CSRF protection)', async () => {
    const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://malicious.com',
      },
      body: JSON.stringify({ position_seconds: 45 }),
    });

    const res = await progressHandler(req, {
      params: Promise.resolve({ lessonId: 'lesson-1' }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Origem da requisição não autorizada');
  });

  it('rejects invalid position_seconds payload', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: 'user-123', is_banned: false, status: 'active' },
    });

    const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://amf-eight.vercel.app',
      },
      body: JSON.stringify({ position_seconds: -10 }),
    });

    const res = await progressHandler(req, {
      params: Promise.resolve({ lessonId: 'lesson-1' }),
    });

    expect(res.status).toBe(400);
  });

  it('rejects progress update if user does not have course access', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: 'user-123', is_banned: false, status: 'active' },
    });
    mockLessonsSelect.mockResolvedValueOnce({
      data: {
        id: 'lesson-1',
        course_modules: { course_id: 'course-abc' },
      },
      error: null,
    });
    mockRpc.mockResolvedValueOnce({ data: false, error: null });

    const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://amf-eight.vercel.app',
      },
      body: JSON.stringify({ position_seconds: 50, duration_seconds: 300 }),
    });

    const res = await progressHandler(req, {
      params: Promise.resolve({ lessonId: 'lesson-1' }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Acesso ao curso não autorizado');
  });

  it('successfully records monotonic progress and auto-completes at 90%', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockProfilesSelect.mockResolvedValueOnce({
      data: { id: 'user-123', is_banned: false, status: 'active' },
    });
    mockLessonsSelect.mockResolvedValue({
      data: {
        id: 'lesson-1',
        duration_seconds: 200,
        module_id: 'mod-1',
        video_asset_id: 'asset-1',
        course_modules: { course_id: 'course-abc' },
      },
      error: null,
    });
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    mockLessonProgressSelect.mockResolvedValueOnce({
      data: {
        last_position_seconds: 50,
        progress_percent: 25,
        is_completed: false,
      },
    });
    mockUpsert.mockResolvedValueOnce({ data: null, error: null });

    const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://amf-eight.vercel.app',
      },
      body: JSON.stringify({ position_seconds: 275, duration_seconds: 300 }),
    });

    const res = await progressHandler(req, {
      params: Promise.resolve({ lessonId: 'lesson-1' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // 275 / 300 = 91.6% -> triggers auto-completion to 100%
    expect(json.is_completed).toBe(true);
    expect(json.percent).toBe(100);
    expect(json.last_position_seconds).toBe(275);
  });

  it('guarantees monotonicity: progress percentage and position never regress', async () => {
    mockLessonsSelect.mockResolvedValue({
      data: {
        id: 'lesson-monotonic',
        duration_seconds: 300,
        module_id: 'mod-1',
        video_asset_id: null,
        course_modules: { course_id: 'course-abc' },
      },
      error: null,
    });

    // Existing progress is at 180 seconds (60%)
    mockLessonProgressSelect.mockResolvedValueOnce({
      data: {
        last_position_seconds: 180,
        progress_percent: 60,
        is_completed: false,
      },
    });
    mockUpsert.mockResolvedValueOnce({ data: null, error: null });

    // Client rewound to 45 seconds and sent progress update
    const result = await updateSecureProgress('user-123', 'lesson-monotonic', 45, 300);

    expect(result.success).toBe(true);
    // Max position remains at 180
    expect(result.last_position_seconds).toBe(180);
    // Progress percent remains at 60%
    expect(result.progress_percent).toBe(60);
    expect(result.is_completed).toBe(false);
  });
});
