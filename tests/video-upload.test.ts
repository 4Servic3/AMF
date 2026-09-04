import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimitStore } from '../src/lib/security/rate-limit';

describe('Admin Rate Limiting Security', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('allows requests within limit and blocks when threshold is reached', () => {
    const key = 'admin_123';
    const limit = 3;
    const windowMs = 60000;

    // 1ª tentativa
    const r1 = checkRateLimit(key, limit, windowMs);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    // 2ª tentativa
    const r2 = checkRateLimit(key, limit, windowMs);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    // 3ª tentativa
    const r3 = checkRateLimit(key, limit, windowMs);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4ª tentativa (deve ser bloqueada)
    const r4 = checkRateLimit(key, limit, windowMs);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('isolates rate limits between different administrators', () => {
    const limit = 2;
    const windowMs = 60000;

    checkRateLimit('admin_A', limit, windowMs);
    checkRateLimit('admin_A', limit, windowMs);
    const blockedA = checkRateLimit('admin_A', limit, windowMs);
    expect(blockedA.allowed).toBe(false);

    // admin_B não deve ser afetado pelo admin_A
    const allowedB = checkRateLimit('admin_B', limit, windowMs);
    expect(allowedB.allowed).toBe(true);
    expect(allowedB.remaining).toBe(1);
  });
});

describe('Direct Upload Security Rules and Business Logic', () => {
  function validateUploadPrerequisites({
    session,
    aal,
    permission,
    originAllowed,
    lessonExists,
    activeUploadExists,
  }: {
    session: boolean;
    aal: string;
    permission: boolean;
    originAllowed: boolean;
    lessonExists: boolean;
    activeUploadExists: boolean;
  }): { status: number; error?: string } {
    if (!session) return { status: 401, error: 'Não autenticado.' };
    if (aal !== 'aal2') return { status: 403, error: 'Autenticação MFA obrigatória.' };
    if (!permission) return { status: 403, error: 'Permissão insuficiente.' };
    if (!originAllowed) return { status: 403, error: 'Origem não autorizada.' };
    if (!lessonExists) return { status: 404, error: 'Aula não encontrada.' };
    if (activeUploadExists) {
      return { status: 409, error: 'Já existe upload ativo em andamento.' };
    }
    return { status: 201 };
  }

  it('blocks unauthenticated requests with 401', () => {
    const res = validateUploadPrerequisites({
      session: false,
      aal: 'aal1',
      permission: false,
      originAllowed: true,
      lessonExists: true,
      activeUploadExists: false,
    });
    expect(res.status).toBe(401);
  });

  it('blocks admin without MFA (AAL2) with 403', () => {
    const res = validateUploadPrerequisites({
      session: true,
      aal: 'aal1',
      permission: true,
      originAllowed: true,
      lessonExists: true,
      activeUploadExists: false,
    });
    expect(res.status).toBe(403);
    expect(res.error).toContain('MFA');
  });

  it('blocks admin without courses.videos.manage permission with 403', () => {
    const res = validateUploadPrerequisites({
      session: true,
      aal: 'aal2',
      permission: false,
      originAllowed: true,
      lessonExists: true,
      activeUploadExists: false,
    });
    expect(res.status).toBe(403);
    expect(res.error).toContain('Permissão');
  });

  it('blocks unauthorized origin with 403', () => {
    const res = validateUploadPrerequisites({
      session: true,
      aal: 'aal2',
      permission: true,
      originAllowed: false,
      lessonExists: true,
      activeUploadExists: false,
    });
    expect(res.status).toBe(403);
    expect(res.error).toContain('Origem');
  });

  it('blocks missing lesson with 404', () => {
    const res = validateUploadPrerequisites({
      session: true,
      aal: 'aal2',
      permission: true,
      originAllowed: true,
      lessonExists: false,
      activeUploadExists: false,
    });
    expect(res.status).toBe(404);
  });

  it('blocks concurrent active upload on the same lesson with 409', () => {
    const res = validateUploadPrerequisites({
      session: true,
      aal: 'aal2',
      permission: true,
      originAllowed: true,
      lessonExists: true,
      activeUploadExists: true,
    });
    expect(res.status).toBe(409);
  });

  it('allows authorized request with valid credentials and MFA', () => {
    const res = validateUploadPrerequisites({
      session: true,
      aal: 'aal2',
      permission: true,
      originAllowed: true,
      lessonExists: true,
      activeUploadExists: false,
    });
    expect(res.status).toBe(201);
  });
});

describe('Video Replacement Audit & Safety Logic', () => {
  function validateVideoReplacement({
    reason,
    newAssetStatus,
    newAssetExists,
  }: {
    reason: string;
    newAssetStatus: string;
    newAssetExists: boolean;
  }): { allowed: boolean; error?: string } {
    if (!reason || reason.trim().length < 5) {
      return { allowed: false, error: 'A justificativa é obrigatória (mínimo 5 caracteres).' };
    }
    if (!newAssetExists) {
      return { allowed: false, error: 'Novo vídeo não encontrado.' };
    }
    if (newAssetStatus !== 'ready') {
      return { allowed: false, error: 'O novo vídeo ainda não está pronto para publicação.' };
    }
    return { allowed: true };
  }

  it('rejects replacement without a clear reason', () => {
    expect(validateVideoReplacement({ reason: '', newAssetStatus: 'ready', newAssetExists: true }).allowed).toBe(false);
    expect(validateVideoReplacement({ reason: 'ok', newAssetStatus: 'ready', newAssetExists: true }).allowed).toBe(false);
  });

  it('rejects replacement if the new video asset is not ready yet', () => {
    const resProcessing = validateVideoReplacement({
      reason: 'Atualização clínica de dosagem e procedimentos.',
      newAssetStatus: 'processing',
      newAssetExists: true,
    });
    expect(resProcessing.allowed).toBe(false);
    expect(resProcessing.error).toContain('não está pronto');
  });

  it('approves replacement when reason is documented and new asset is ready', () => {
    const res = validateVideoReplacement({
      reason: 'Revisão da aula de cardiologia com novos exames complementares.',
      newAssetStatus: 'ready',
      newAssetExists: true,
    });
    expect(res.allowed).toBe(true);
  });
});

describe('Asset Association Sanitization', () => {
  function sanitizeMuxAssetId(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    const trimmed = input.trim();
    return /^[a-zA-Z0-9_\-]+$/.test(trimmed) && trimmed.length <= 100;
  }

  it('accepts valid Mux Asset IDs', () => {
    expect(sanitizeMuxAssetId('0201xV93qABC123')).toBe(true);
    expect(sanitizeMuxAssetId('asset_abc_def-123')).toBe(true);
  });

  it('rejects URLs, iframes, HTML or script tags', () => {
    expect(sanitizeMuxAssetId('https://stream.mux.com/123')).toBe(false);
    expect(sanitizeMuxAssetId('<script>alert(1)</script>')).toBe(false);
    expect(sanitizeMuxAssetId('<iframe src="evil.com"></iframe>')).toBe(false);
    expect(sanitizeMuxAssetId("'; DROP TABLE lessons; --")).toBe(false);
  });
});
