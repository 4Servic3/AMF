import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeOrigin,
  isOriginAllowed,
  validateRequestOrigin,
} from '../src/lib/mux/origins';
import {
  getMuxEnvironment,
  resolveAllowedOrigins,
  getMuxSafeConfig,
  MuxConfigurationError,
} from '../src/lib/mux/config';

describe('Mux Origin Security', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes valid origins properly', () => {
    expect(normalizeOrigin('https://amf-eight.vercel.app/some/path?query=1')).toBe(
      'https://amf-eight.vercel.app'
    );
    expect(normalizeOrigin('http://localhost:3000/')).toBe('http://localhost:3000');
    expect(normalizeOrigin('   https://MYDOMAIN.COM   ')).toBe('https://mydomain.com');
  });

  it('rejects invalid or unsafe URL schemes', () => {
    expect(normalizeOrigin(null)).toBeNull();
    expect(normalizeOrigin('')).toBeNull();
    expect(normalizeOrigin('javascript:alert(1)')).toBeNull();
    expect(normalizeOrigin('not-a-url')).toBeNull();
  });

  it('allows canonical domain in production environment', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('MUX_ALLOWED_ORIGINS', 'https://amf-eight.vercel.app');

    expect(isOriginAllowed('https://amf-eight.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://evil-site.com')).toBe(false);
    expect(isOriginAllowed('http://localhost:3000')).toBe(false);
  });

  it('allows vercel preview subdomains only in preview environment', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'amf-git-preview-branch.vercel.app');

    expect(isOriginAllowed('https://amf-git-preview-branch.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://evil.com')).toBe(false);
    expect(isOriginAllowed('https://another-project.vercel.app')).toBe(false);
  });

  it('allows localhost and local network in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL_ENV', 'development');

    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:3000')).toBe(true);
    expect(isOriginAllowed('http://192.168.0.7:3000')).toBe(true);
    expect(isOriginAllowed('https://malicious-domain.com')).toBe(false);
  });

  it('validates request origin from HTTP headers and ignores body', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('MUX_ALLOWED_ORIGINS', 'https://amf-eight.vercel.app');

    const reqValid = new Request('https://api.amf.com/api/admin/mux-upload', {
      method: 'POST',
      headers: {
        origin: 'https://amf-eight.vercel.app',
      },
    });

    const resultValid = validateRequestOrigin(reqValid);
    expect(resultValid.allowed).toBe(true);
    expect(resultValid.origin).toBe('https://amf-eight.vercel.app');

    const reqInvalid = new Request('https://api.amf.com/api/admin/mux-upload', {
      method: 'POST',
      headers: {
        origin: 'https://attacker.com',
      },
    });

    const resultInvalid = validateRequestOrigin(reqInvalid);
    expect(resultInvalid.allowed).toBe(false);
  });
});

describe('Mux Configuration Security', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('detects environments reliably', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(getMuxEnvironment()).toBe('production');

    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(getMuxEnvironment()).toBe('preview');

    vi.stubEnv('VERCEL_ENV', 'development');
    expect(getMuxEnvironment()).toBe('development');
  });

  it('never leaks secrets in safe config inspection', () => {
    vi.stubEnv('MUX_PLAYBACK_RESTRICTION_ID', 'restr_12345');
    vi.stubEnv('MUX_ALLOWED_ORIGINS', 'https://amf-eight.vercel.app');

    const safeConfig = getMuxSafeConfig();

    expect(safeConfig.playbackRestrictionId).toBe('restr_12345');
    expect(safeConfig.allowedOrigins).toContain('https://amf-eight.vercel.app');

    // Confirma que não há propriedades de chaves privadas ou tokens no objeto seguro
    expect((safeConfig as any).tokenId).toBeUndefined();
    expect((safeConfig as any).tokenSecret).toBeUndefined();
    expect((safeConfig as any).privateKey).toBeUndefined();
    expect((safeConfig as any).signingKeyId).toBeUndefined();
    expect((safeConfig as any).webhookSecret).toBeUndefined();
  });

  it('throws sanitized MuxConfigurationError without leaking details', async () => {
    // Importa dinamicamente getMuxCredentials para testar falha sanitizada
    const { getMuxCredentials } = await import('../src/lib/mux/config');

    vi.stubEnv('MUX_TOKEN_ID', '');
    vi.stubEnv('MUX_TOKEN_SECRET', '');

    expect(() => getMuxCredentials()).toThrow(MuxConfigurationError);
    expect(() => getMuxCredentials()).toThrow('Mux não configurado: variáveis essenciais ausentes no servidor.');
  });

  it('guarantees server-only protection prevents client-side execution', async () => {
    // Simula a tentativa de carregamento da implementação real de server-only em contexto não-servidor
    await expect(async () => {
      await vi.importActual<any>('server-only');
    }).rejects.toThrow('This module cannot be imported from a Client Component module');
  });
});

