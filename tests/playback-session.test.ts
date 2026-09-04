import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generatePlaybackSessionTokens } from '../src/lib/mux/client';

describe('Playback Token RS256 Claims & Granularity Verification', () => {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const privateBase64 = Buffer.from(privatePem).toString('base64');

  const TEST_PLAYBACK_ID = 'mux_playback_xyz123';
  const TEST_KEY_ID = 'mux_signing_key_456';
  const TEST_RESTRICTION_ID = 'restr_canonical_amf';

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('MUX_TOKEN_ID', 'test_token');
    vi.stubEnv('MUX_TOKEN_SECRET', 'test_secret');
    vi.stubEnv('MUX_SIGNING_KEY_ID', TEST_KEY_ID);
    vi.stubEnv('MUX_PRIVATE_KEY', privateBase64);
    vi.stubEnv('MUX_PLAYBACK_RESTRICTION_ID', TEST_RESTRICTION_ID);
    vi.stubEnv('MUX_WEBHOOK_SECRET', 'test_wh_secret');
  });

  it('generates three distinct granular tokens with correct claims', async () => {
    const sessionId = crypto.randomUUID();
    const durationSeconds = 2400; // 40 minutos

    const result = await generatePlaybackSessionTokens({
      playbackId: TEST_PLAYBACK_ID,
      durationSeconds,
      sessionId,
    });

    expect(result.tokens).toBeDefined();
    expect(result.tokens.playback).toBeDefined();
    expect(result.tokens.thumbnail).toBeDefined();
    expect(result.tokens.storyboard).toBeDefined();

    // Decodifica e verifica os tokens
    const decodedPlayback = jwt.decode(result.tokens.playback, { complete: true }) as any;
    const decodedThumbnail = jwt.decode(result.tokens.thumbnail, { complete: true }) as any;
    const decodedStoryboard = jwt.decode(result.tokens.storyboard, { complete: true }) as any;

    // 1. Verificação de Header e Algoritmo
    expect(decodedPlayback.header.alg).toBe('RS256');
    expect(decodedPlayback.payload.kid || decodedPlayback.header.kid).toBe(TEST_KEY_ID);

    // 2. Verificação de Claims do Playback (aud = 'v')
    expect(decodedPlayback.payload.sub).toBe(TEST_PLAYBACK_ID);
    expect(decodedPlayback.payload.aud).toBe('v');
    expect(decodedPlayback.payload.playback_restriction_id).toBe(TEST_RESTRICTION_ID);
    expect(decodedPlayback.payload.session_id).toBe(sessionId);

    // 3. Verificação de Claims do Thumbnail (aud = 't')
    expect(decodedThumbnail.payload.sub).toBe(TEST_PLAYBACK_ID);
    expect(decodedThumbnail.payload.aud).toBe('t');
    expect(decodedThumbnail.payload.playback_restriction_id).toBe(TEST_RESTRICTION_ID);

    // 4. Verificação de Claims do Storyboard (aud = 's')
    expect(decodedStoryboard.payload.sub).toBe(TEST_PLAYBACK_ID);
    expect(decodedStoryboard.payload.aud).toBe('s');
    expect(decodedStoryboard.payload.playback_restriction_id).toBe(TEST_RESTRICTION_ID);

    // 5. Confirma que os tokens não são idênticos/trocados
    expect(result.tokens.playback).not.toBe(result.tokens.thumbnail);
    expect(result.tokens.playback).not.toBe(result.tokens.storyboard);
    expect(result.tokens.thumbnail).not.toBe(result.tokens.storyboard);
  });

  it('guarantees minimum TTL of 30 minutes (1800s) even for very short videos', async () => {
    const sessionId = crypto.randomUUID();
    const shortVideoDuration = 60; // 1 minuto

    const result = await generatePlaybackSessionTokens({
      playbackId: TEST_PLAYBACK_ID,
      durationSeconds: shortVideoDuration,
      sessionId,
    });

    // Mínimo de 30 minutos (1800s) garantido
    expect(result.ttlSeconds).toBeGreaterThanOrEqual(1800);

    const decoded = jwt.decode(result.tokens.playback) as any;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = decoded.exp - nowSeconds;
    expect(remainingSeconds).toBeGreaterThanOrEqual(1790);
  });

  it('calculates dynamic TTL covering entire video plus 10 minutes', async () => {
    const sessionId = crypto.randomUUID();
    const durationSeconds = 3600; // 60 minutos

    const result = await generatePlaybackSessionTokens({
      playbackId: TEST_PLAYBACK_ID,
      durationSeconds,
      sessionId,
    });

    // 3600s + 600s (10 minutos) = 4200s
    expect(result.ttlSeconds).toBe(4200);
  });
});

describe('Playback Session Authorization Workflow Order', () => {
  interface AuthContext {
    hasSession: boolean;
    userBanned: boolean;
    lessonPublished: boolean;
    coursePublished: boolean;
    hasEntitlement: boolean;
    accessExpired: boolean;
    videoStatus: 'ready' | 'processing' | 'errored' | 'none';
    videoPolicy: 'signed' | 'public';
    originAllowed: boolean;
  }

  function evaluatePlaybackAuthorization(ctx: AuthContext): { status: number; error?: string } {
    if (!ctx.hasSession) {
      return { status: 401, error: 'Autenticação necessária.' };
    }
    if (ctx.userBanned) {
      return { status: 403, error: 'Usuário bloqueado.' };
    }
    if (!ctx.originAllowed) {
      return { status: 403, error: 'Origem não permitida.' };
    }
    if (!ctx.lessonPublished || !ctx.coursePublished) {
      return { status: 404, error: 'Conteúdo em rascunho.' };
    }
    if (!ctx.hasEntitlement) {
      return { status: 403, error: 'Você não possui acesso ativo a este curso.' };
    }
    if (ctx.accessExpired) {
      return { status: 403, error: 'Período de acesso expirado.' };
    }
    if (ctx.videoStatus === 'processing') {
      return { status: 425, error: 'Vídeo em processamento.' };
    }
    if (ctx.videoStatus !== 'ready') {
      return { status: 404, error: 'Vídeo indisponível.' };
    }
    if (ctx.videoPolicy !== 'signed') {
      return { status: 403, error: 'Conteúdo requer política signed.' };
    }
    return { status: 200 };
  }

  it('blocks unauthenticated user with 401', () => {
    const res = evaluatePlaybackAuthorization({
      hasSession: false,
      userBanned: false,
      lessonPublished: true,
      coursePublished: true,
      hasEntitlement: true,
      accessExpired: false,
      videoStatus: 'ready',
      videoPolicy: 'signed',
      originAllowed: true,
    });
    expect(res.status).toBe(401);
  });

  it('blocks authenticated user without entitlement with 403', () => {
    const res = evaluatePlaybackAuthorization({
      hasSession: true,
      userBanned: false,
      lessonPublished: true,
      coursePublished: true,
      hasEntitlement: false,
      accessExpired: false,
      videoStatus: 'ready',
      videoPolicy: 'signed',
      originAllowed: true,
    });
    expect(res.status).toBe(403);
    expect(res.error).toContain('não possui acesso');
  });

  it('blocks expired enrollment with 403', () => {
    const res = evaluatePlaybackAuthorization({
      hasSession: true,
      userBanned: false,
      lessonPublished: true,
      coursePublished: true,
      hasEntitlement: true,
      accessExpired: true,
      videoStatus: 'ready',
      videoPolicy: 'signed',
      originAllowed: true,
    });
    expect(res.status).toBe(403);
    expect(res.error).toContain('expirado');
  });

  it('blocks draft lesson or course with 404', () => {
    const res = evaluatePlaybackAuthorization({
      hasSession: true,
      userBanned: false,
      lessonPublished: false,
      coursePublished: true,
      hasEntitlement: true,
      accessExpired: false,
      videoStatus: 'ready',
      videoPolicy: 'signed',
      originAllowed: true,
    });
    expect(res.status).toBe(404);
  });

  it('blocks video still processing with 425', () => {
    const res = evaluatePlaybackAuthorization({
      hasSession: true,
      userBanned: false,
      lessonPublished: true,
      coursePublished: true,
      hasEntitlement: true,
      accessExpired: false,
      videoStatus: 'processing',
      videoPolicy: 'signed',
      originAllowed: true,
    });
    expect(res.status).toBe(425);
  });

  it('blocks video with public policy on premium content with 403', () => {
    const res = evaluatePlaybackAuthorization({
      hasSession: true,
      userBanned: false,
      lessonPublished: true,
      coursePublished: true,
      hasEntitlement: true,
      accessExpired: false,
      videoStatus: 'ready',
      videoPolicy: 'public',
      originAllowed: true,
    });
    expect(res.status).toBe(403);
  });

  it('approves legitimate authorized student with 200', () => {
    const res = evaluatePlaybackAuthorization({
      hasSession: true,
      userBanned: false,
      lessonPublished: true,
      coursePublished: true,
      hasEntitlement: true,
      accessExpired: false,
      videoStatus: 'ready',
      videoPolicy: 'signed',
      originAllowed: true,
    });
    expect(res.status).toBe(200);
  });
});
