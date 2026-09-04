import 'server-only';

/**
 * Erro sanitizado de configuração do Mux.
 * Garante que nenhuma informação confidencial, token ou chave privada
 * seja vazada em logs, stack traces ou mensagens de erro.
 */
export class MuxConfigurationError extends Error {
  constructor(message: string = 'Configuração do serviço de vídeo inválida ou incompleta.') {
    super(message);
    this.name = 'MuxConfigurationError';
  }
}

export type EnvironmentType = 'production' | 'preview' | 'development' | 'test';

export interface MuxSafeConfig {
  environment: EnvironmentType;
  playbackRestrictionId: string | null;
  allowedOrigins: string[];
}

interface MuxInternalCredentials {
  tokenId: string;
  tokenSecret: string;
  signingKeyId: string;
  privateKey: string;
  webhookSecret: string;
  playbackRestrictionId: string | null;
  allowedOrigins: string[];
}

const CANONICAL_PRODUCTION_DOMAIN = 'https://amf-eight.vercel.app';

/**
 * Detecta o ambiente de execução atual conforme Vercel e Node.
 */
export function getMuxEnvironment(): EnvironmentType {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  if (vercelEnv === 'development') return 'development';

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'test') return 'test';
  return 'development';
}

/**
 * Valida que nenhuma variável de ambiente confidencial do Mux
 * foi indevidamente exposta no escopo público do Next.js (NEXT_PUBLIC_).
 */
function assertNoPublicExposure(): void {
  const envKeys = Object.keys(process.env);
  const leakedKey = envKeys.find(
    (key) => key.startsWith('NEXT_PUBLIC_MUX_') || key.startsWith('NEXT_PUBLIC_VIDEO_PROVIDER')
  );

  if (leakedKey) {
    throw new MuxConfigurationError(
      'Violação de segurança detectada: credenciais de vídeo não podem ter escopo público.'
    );
  }
}

/**
 * Normaliza e compõe a lista de origens autorizadas server-side.
 */
export function resolveAllowedOrigins(): string[] {
  const rawOrigins = process.env.MUX_ALLOWED_ORIGINS || '';
  const parsed = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const env = getMuxEnvironment();
  const origins = new Set<string>();

  // Adiciona origens configuradas explicitamente
  for (const origin of parsed) {
    try {
      const url = new URL(origin);
      origins.add(url.origin);
    } catch {
      // Ignora formato inválido silenciosamente
    }
  }

  // Em produção, o domínio canônico é sempre obrigatório
  if (env === 'production') {
    origins.add(CANONICAL_PRODUCTION_DOMAIN);
  } else if (env === 'development' || env === 'test') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  return Array.from(origins);
}

/**
 * Recupera e valida as credenciais internamente para uso estrito do servidor.
 * NUNCA exporta os segredos diretamente para o restante da aplicação.
 */
export function getMuxCredentials(): MuxInternalCredentials {
  assertNoPublicExposure();

  const tokenId = process.env.MUX_TOKEN_ID?.trim();
  const tokenSecret = process.env.MUX_TOKEN_SECRET?.trim();
  // Suporte aos nomes oficiais com retrocompatibilidade
  const signingKeyId = (process.env.MUX_SIGNING_KEY_ID || process.env.MUX_SIGNING_KEY)?.trim();
  const privateKey = (process.env.MUX_PRIVATE_KEY || process.env.MUX_SIGNING_SECRET)?.trim();
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET?.trim();
  const playbackRestrictionId = process.env.MUX_PLAYBACK_RESTRICTION_ID?.trim() || null;

  const missingRequirements = !tokenId || !tokenSecret || !signingKeyId || !privateKey;

  if (missingRequirements) {
    throw new MuxConfigurationError(
      'Mux não configurado: variáveis essenciais ausentes no servidor.'
    );
  }

  return {
    tokenId,
    tokenSecret,
    signingKeyId,
    privateKey,
    webhookSecret: webhookSecret || '',
    playbackRestrictionId,
    allowedOrigins: resolveAllowedOrigins(),
  };
}

/**
 * Retorna configurações seguras não confidenciais para inspeção de saúde.
 */
export function getMuxSafeConfig(): MuxSafeConfig {
  const env = getMuxEnvironment();
  const restrictionId = process.env.MUX_PLAYBACK_RESTRICTION_ID?.trim() || null;

  return {
    environment: env,
    playbackRestrictionId: restrictionId,
    allowedOrigins: resolveAllowedOrigins(),
  };
}
