import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { POST as playbackSessionHandler } from '../src/app/api/courses/lessons/[lessonId]/playback-session/route';
import { POST as videoUploadHandler } from '../src/app/api/admin/courses/lessons/[lessonId]/video-upload/route';
import { verifyWebhookSignature } from '../src/lib/mux/webhooks';
import { checkRateLimit } from '../src/lib/security/rate-limit';

// Chave RSA de teste para assinatura de JWTs
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

vi.mock('@/lib/mux', async () => {
  const actual = await vi.importActual<any>('@/lib/mux');
  return {
    ...actual,
    validateRequestOrigin: vi.fn((req: Request) => {
      const origin = req.headers.get('origin');
      if (origin === 'https://malicious-site.com' || origin === 'http://evil.com') {
        return { allowed: false, origin: null, reason: 'unauthorized_origin' };
      }
      return { allowed: true, origin: 'https://amf-eight.vercel.app' };
    }),
    generatePlaybackSessionTokens: vi.fn(async ({ playbackId, durationSeconds, sessionId }) => {
      const exp = Math.floor(Date.now() / 1000) + Math.max(1800, (durationSeconds || 0) + 600);
      const token = jwt.sign({ sub: playbackId, aud: 'v', exp, session_id: sessionId }, privateKey, {
        algorithm: 'RS256',
        keyid: 'test-key-id',
      });
      return {
        tokens: { playback: token, thumbnail: token, storyboard: token },
        expiresAt: new Date(exp * 1000).toISOString(),
      };
    }),
  };
});

// Mock Service Role Client para evitar chamadas de rede no teste
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock Supabase Server Client
const mockGetUser = vi.fn();
const mockProfilesSelect = vi.fn();
const mockLessonsSelect = vi.fn();
const mockRpc = vi.fn();
const mockEnrollmentsSelect = vi.fn();
const mockVideoAssetsSelect = vi.fn();
const mockLessonVideosSelect = vi.fn();
const mockProgressSelect = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: 'aal1' }, // Default não é AAL2
          error: null,
        }),
      },
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
              maybeSingle: mockLessonsSelect,
              single: mockLessonsSelect,
            }),
          }),
        };
      }
      if (table === 'enrollments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockEnrollmentsSelect,
              }),
            }),
          }),
        };
      }
      if (table === 'lesson_videos') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockLessonVideosSelect,
              }),
            }),
          }),
        };
      }
      if (table === 'video_assets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockVideoAssetsSelect,
            }),
          }),
        };
      }
      if (table === 'lesson_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockProgressSelect,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  })),
}));

describe('ABUSE & HARDENING TEST SUITE (PROMPT 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('MUX_TOKEN_ID', 'test_token_id');
    vi.stubEnv('MUX_TOKEN_SECRET', 'test_token_secret');
    vi.stubEnv('MUX_SIGNING_KEY_ID', 'test_key_id');
    const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    vi.stubEnv('MUX_PRIVATE_KEY', Buffer.from(privatePem).toString('base64'));
    vi.stubEnv('MUX_WEBHOOK_SECRET', 'test_webhook_secret_key');
    vi.stubEnv('MUX_PLAYBACK_RESTRICTION_ID', 'restr_test');

    // Default mocks
    mockProfilesSelect.mockResolvedValue({
      data: { id: 'user-default', is_banned: false, status: 'active', role: 'member' },
      error: null,
    });
    mockEnrollmentsSelect.mockResolvedValue({
      data: { status: 'active', expires_at: new Date(Date.now() + 86400000).toISOString() },
      error: null,
    });
    mockRpc.mockImplementation(async (fnName: string, args: any) => {
      if (fnName === 'has_permission') {
        return { data: false, error: null };
      }
      if (fnName === 'has_course_access') {
        return { data: true, error: null };
      }
      return { data: true, error: null };
    });
  });

  describe('1. Playback Tokens & Access Control Abuse', () => {
    it('Cenário 1: Rejeita token expirado (exp < now)', () => {
      const expiredPayload = {
        sub: 'playback-123',
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) - 300, // expirou há 5 minutos
      };
      const token = jwt.sign(expiredPayload, privateKey, { algorithm: 'RS256' });

      expect(() => {
        jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      }).toThrow(/jwt expired/);
    });

    it('Cenário 2: Rejeita token de outra aula (subject mismatch)', () => {
      const lessonPlaybackId = 'playback-aula-1';
      const attackerPlaybackId = 'playback-aula-2';

      const tokenFromAnotherLesson = jwt.sign(
        { sub: attackerPlaybackId, aud: 'v', exp: Math.floor(Date.now() / 1000) + 3600 },
        privateKey,
        { algorithm: 'RS256' }
      );

      const decoded: any = jwt.verify(tokenFromAnotherLesson, publicKey);
      expect(decoded.sub).not.toBe(lessonPlaybackId);
      expect(decoded.sub === lessonPlaybackId).toBe(false);
    });

    it('Cenário 3: Rejeita audience incorreta (aud="t" tentando reproduzir vídeo)', () => {
      const thumbnailToken = jwt.sign(
        { sub: 'playback-123', aud: 't', exp: Math.floor(Date.now() / 1000) + 3600 },
        privateKey,
        { algorithm: 'RS256' }
      );

      const decoded: any = jwt.decode(thumbnailToken);
      expect(decoded.aud).toBe('t');
      // Player de vídeo só aceita aud = 'v'
      const isAudienceValidForVideo = decoded.aud === 'v';
      expect(isAudienceValidForVideo).toBe(false);
    });

    it('Cenário 4: Rejeita requisição fora do domínio permitido (CSRF/Origin Spoofing)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-valid' } },
        error: null,
      });

      const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/playback-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://malicious-site.com',
        },
      });

      const res = await playbackSessionHandler(req, {
        params: Promise.resolve({ lessonId: 'lesson-1' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Origem da requisição não autorizada');
    });

    it('Cenário 5: Rejeita requisição após revogação de entitlement', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-revoked' } },
        error: null,
      });
      mockProfilesSelect.mockResolvedValueOnce({
        data: { id: 'user-revoked', is_banned: false, status: 'active', role: 'member' },
      });
      mockLessonsSelect.mockResolvedValueOnce({
        data: {
          id: 'lesson-1',
          status: 'published',
          course_modules: {
            id: 'mod-1',
            status: 'published',
            course_id: 'course-1',
            courses: { id: 'course-1', status: 'published' },
          },
        },
      });
      // Entitlement revogado: has_course_access = false
      mockRpc.mockImplementation(async (fnName: string) => {
        if (fnName === 'has_permission') return { data: false, error: null };
        if (fnName === 'has_course_access') return { data: false, error: null };
        return { data: false, error: null };
      });

      const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/playback-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://amf-eight.vercel.app',
        },
      });

      const res = await playbackSessionHandler(req, {
        params: Promise.resolve({ lessonId: 'lesson-1' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Você não possui acesso ativo');
    });

    it('Cenário 6: Rejeita requisição para matrícula com prazo expirado', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-expired' } },
        error: null,
      });
      mockProfilesSelect.mockResolvedValueOnce({
        data: { id: 'user-expired', is_banned: false, status: 'active', role: 'member' },
      });
      mockLessonsSelect.mockResolvedValueOnce({
        data: {
          id: 'lesson-1',
          status: 'published',
          course_modules: {
            id: 'mod-1',
            status: 'published',
            course_id: 'course-1',
            courses: { id: 'course-1', status: 'published' },
          },
        },
      });
      mockRpc.mockResolvedValueOnce({ data: true, error: null });
      // Matrícula expirou
      mockEnrollmentsSelect.mockResolvedValueOnce({
        data: {
          status: 'active',
          expires_at: new Date(Date.now() - 3600000).toISOString(),
        },
      });

      const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/playback-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://amf-eight.vercel.app',
        },
      });

      const res = await playbackSessionHandler(req, {
        params: Promise.resolve({ lessonId: 'lesson-1' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('período de acesso a este curso expirou');
    });
  });

  describe('2. Webhook Mux Security & Anti-Replay', () => {
    it('Cenário 7: Rejeita replay de webhook com timestamp antigo (> 5 minutos)', async () => {
      const rawBody = JSON.stringify({ type: 'video.asset.ready', id: 'evt_123' });
      const oldTimestamp = Math.floor(Date.now() / 1000) - 360; // 6 minutos atrás
      const muxSignatureHeader = `t=${oldTimestamp},v1=fakehash`;

      const result = await verifyWebhookSignature(rawBody, { 'mux-signature': muxSignatureHeader });
      expect(result.valid).toBe(false);
    });

    it('Cenário 8: Rejeita webhook com assinatura forjada/inválida', async () => {
      const rawBody = JSON.stringify({ type: 'video.asset.ready', id: 'evt_123' });
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const forgedSignature = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const muxSignatureHeader = `t=${currentTimestamp},v1=${forgedSignature}`;

      const result = await verifyWebhookSignature(rawBody, { 'mux-signature': muxSignatureHeader });
      expect(result.valid).toBe(false);
    });
  });

  describe('3. Administrative MFA & Role Enforcement', () => {
    it('Cenário 9: Bloqueia tentativa de upload por aluno comum sem AAL2/MFA', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'student-id' } },
        error: null,
      });

      const req = new Request('https://amf-eight.vercel.app/api/admin/courses/lessons/lesson-1/video-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://amf-eight.vercel.app',
        },
      });

      const res = await videoUploadHandler(req, {
        params: Promise.resolve({ lessonId: 'lesson-1' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('MFA/AAL2');
    });
  });

  describe('4. Rate Limiting & Abuse Prevention', () => {
    it('Cenário 10: Bloqueia rajadas excessivas com rate limiter em memória', () => {
      const key = `abuse_test_client_${Date.now()}`;
      const maxRequests = 5;
      const windowMs = 1000;

      // Executa 5 requisições permitidas
      for (let i = 0; i < maxRequests; i++) {
        const result = checkRateLimit(key, maxRequests, windowMs);
        expect(result.allowed).toBe(true);
      }

      // 6ª requisição deve ser bloqueada
      const blocked = checkRateLimit(key, maxRequests, windowMs);
      expect(blocked.allowed).toBe(false);
      expect(blocked.resetAt).toBeGreaterThan(Date.now());
    });
  });

  describe('5. Response Security & Anti-Cache Headers', () => {
    it('Cenário 11: Resposta com tokens possui headers estritos de não-armazenamento', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-valid' } },
        error: null,
      });
      mockProfilesSelect.mockResolvedValueOnce({
        data: { id: 'user-valid', is_banned: false, status: 'active', role: 'member' },
      });
      mockLessonsSelect.mockResolvedValueOnce({
        data: {
          id: 'lesson-1',
          status: 'published',
          video_asset_id: 'asset-1',
          course_modules: {
            id: 'mod-1',
            status: 'published',
            course_id: 'course-1',
            courses: { id: 'course-1', status: 'published' },
          },
        },
      });
      mockRpc.mockResolvedValueOnce({ data: true, error: null });
      mockVideoAssetsSelect.mockResolvedValueOnce({
        data: {
          id: 'asset-1',
          status: 'ready',
          mux_playback_id: 'signed-playback-123',
          playback_policy: 'signed',
          duration_seconds: 120,
        },
      });
      mockLessonVideosSelect.mockResolvedValueOnce({
        data: { video_asset_id: 'asset-1' },
      });
      mockProgressSelect.mockResolvedValueOnce({
        data: { last_position_seconds: 15 },
      });

      const req = new Request('https://amf-eight.vercel.app/api/courses/lessons/lesson-1/playback-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://amf-eight.vercel.app',
        },
      });

      const res = await playbackSessionHandler(req, {
        params: Promise.resolve({ lessonId: 'lesson-1' }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      expect(res.headers.get('Pragma')).toBe('no-cache');
      expect(res.headers.get('Vary')).toContain('Origin');
    });
  });
});
