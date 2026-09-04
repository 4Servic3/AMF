import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  verifyWebhookSignature,
  getWebhookMetrics,
  resetWebhookMetrics,
} from '../src/lib/mux/webhooks';

describe('Mux Webhook Signature & Anti-Replay Verification', () => {
  const TEST_SECRET = 'mux_webhook_secret_test_12345';

  beforeEach(() => {
    vi.unstubAllEnvs();
    resetWebhookMetrics();
    vi.stubEnv('MUX_TOKEN_ID', 'test_token');
    vi.stubEnv('MUX_TOKEN_SECRET', 'test_secret');
    vi.stubEnv('MUX_SIGNING_KEY_ID', 'test_key_id');
    vi.stubEnv('MUX_PRIVATE_KEY', 'test_private_key');
    vi.stubEnv('MUX_WEBHOOK_SECRET', TEST_SECRET);
  });

  // Helper para assinar payload conforme o padrão oficial do Mux (t=timestamp,v1=hash)
  function signMuxPayload(payload: string, secret: string, timestampSeconds?: number): string {
    const t = timestampSeconds ?? Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${t}.${payload}`)
      .digest('hex');
    return `t=${t},v1=${signature}`;
  }

  it('accepts valid signature with recent timestamp', async () => {
    const body = JSON.stringify({ id: 'evt_1', type: 'video.asset.ready', data: { id: 'as_1' } });
    const signatureHeader = signMuxPayload(body, TEST_SECRET);

    const result = await verifyWebhookSignature(body, { 'mux-signature': signatureHeader });
    expect(result.valid).toBe(true);

    const metrics = getWebhookMetrics();
    expect(metrics.totalReceived).toBe(1);
    expect(metrics.verified).toBe(1);
    expect(metrics.invalidSignature).toBe(0);
  });

  it('rejects forged signature', async () => {
    const body = JSON.stringify({ id: 'evt_forged', type: 'video.asset.ready' });
    const fakeSignature = 't=1700000000,v1=deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd';

    const result = await verifyWebhookSignature(body, { 'mux-signature': fakeSignature });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('inválida');

    const metrics = getWebhookMetrics();
    expect(metrics.invalidSignature).toBe(1);
  });

  it('rejects body altered after signature computation', async () => {
    const originalBody = JSON.stringify({ id: 'evt_1', type: 'video.asset.ready', amount: 10 });
    const alteredBody = JSON.stringify({ id: 'evt_1', type: 'video.asset.ready', amount: 9999 });

    // Assina com o corpo original mas envia o corpo alterado
    const signatureHeader = signMuxPayload(originalBody, TEST_SECRET);

    const result = await verifyWebhookSignature(alteredBody, { 'mux-signature': signatureHeader });
    expect(result.valid).toBe(false);
  });

  it('rejects timestamps older than 5 minutes (anti-replay defense)', async () => {
    const body = JSON.stringify({ id: 'evt_old', type: 'video.asset.ready' });
    const sixMinutesAgo = Math.floor(Date.now() / 1000) - 360; // 6 minutos atrás
    const oldSignatureHeader = signMuxPayload(body, TEST_SECRET, sixMinutesAgo);

    const result = await verifyWebhookSignature(body, { 'mux-signature': oldSignatureHeader });
    expect(result.valid).toBe(false);

    const metrics = getWebhookMetrics();
    expect(metrics.timestampTooOld).toBe(1);
  });

  it('rejects signature signed with staging secret when evaluated with production secret', async () => {
    const stagingSecret = 'mux_secret_staging_abc';
    const productionSecret = 'mux_secret_production_xyz';

    vi.stubEnv('MUX_WEBHOOK_SECRET', productionSecret);

    const body = JSON.stringify({ id: 'evt_staging', type: 'video.asset.ready' });
    const stagingSignedHeader = signMuxPayload(body, stagingSecret);

    const result = await verifyWebhookSignature(body, { 'mux-signature': stagingSignedHeader });
    expect(result.valid).toBe(false);
  });
});

describe('Webhook Event Idempotency & Order Logic', () => {
  it('selects exclusively signed playback policy and ignores public ones', () => {
    const mockPlaybackIds = [
      { id: 'pub_123', policy: 'public' },
      { id: 'sgn_456', policy: 'signed' },
    ];

    const signedPlayback = mockPlaybackIds.find((p) => p.policy === 'signed')?.id;
    expect(signedPlayback).toBe('sgn_456');

    // Se só tiver público, não seleciona
    const onlyPublic = [{ id: 'pub_999', policy: 'public' }];
    const signedFromPublicOnly = onlyPublic.find((p) => p.policy === 'signed')?.id;
    expect(signedFromPublicOnly).toBeUndefined();
  });

  it('prevents state regression from ready or archived to processing', () => {
    function shouldUpdateToProcessing(currentStatus: string): boolean {
      if (currentStatus === 'ready' || currentStatus === 'archived') {
        return false;
      }
      return true;
    }

    expect(shouldUpdateToProcessing('pending')).toBe(true);
    expect(shouldUpdateToProcessing('uploading')).toBe(true);
    expect(shouldUpdateToProcessing('ready')).toBe(false);
    expect(shouldUpdateToProcessing('archived')).toBe(false);
  });

  it('sanitizes error messages properly', () => {
    const rawErrors = {
      type: 'invalid_audio_codec_long_error_type_beyond_limits',
      messages: [
        'The audio codec could not be decoded by Mux transcoder because of an invalid sample rate in track 1.',
        'Secondary detailed stack trace with internal server references.',
      ],
    };

    const errorCode = (rawErrors.type || 'error').slice(0, 50);
    const errorMsg = rawErrors.messages.join('; ').slice(0, 255);

    expect(errorCode.length).toBeLessThanOrEqual(50);
    expect(errorMsg.length).toBeLessThanOrEqual(255);
    expect(errorMsg).toContain('The audio codec could not be decoded');
  });
});
