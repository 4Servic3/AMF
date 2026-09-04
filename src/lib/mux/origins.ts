import 'server-only';
import { getMuxEnvironment, resolveAllowedOrigins } from './config';

/**
 * Normaliza uma string de URL para extrair estritamente o origin (protocolo + hostname + porta opcional).
 * Rejeita caminhos, query strings, caracteres inválidos ou esquemas inseguros (ex: javascript:).
 */
export function normalizeOrigin(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Valida se um origin normalizado pertence à allowlist server-side.
 * Protegido contra manipulação:
 * - Em produção: apenas o domínio canônico ou origens estritamente listadas.
 * - Em preview: aceita subdomínios oficiais da Vercel para branch previews (*.vercel.app).
 * - Em dev/test: aceita localhost e rede local configurada.
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  const allowedList = resolveAllowedOrigins();
  if (allowedList.includes(normalized)) {
    return true;
  }

  const env = getMuxEnvironment();

  // Em Preview/Staging na Vercel: validar subdomínios legítimos .vercel.app
  if (env === 'preview') {
    try {
      const url = new URL(normalized);
      if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
        return true;
      }
    } catch {
      return false;
    }
  }

  // Em desenvolvimento: aceitar origens locais
  if (env === 'development') {
    try {
      const url = new URL(normalized);
      const host = url.hostname;
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.startsWith('172.')
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Extrai e valida a origem diretamente dos headers HTTP da requisição (Origin ou Referer).
 * NUNCA aceita parâmetros de origem fornecidos pelo cliente no corpo JSON.
 */
export function validateRequestOrigin(req: Request): {
  allowed: boolean;
  origin: string | null;
} {
  const originHeader = req.headers.get('origin');
  const refererHeader = req.headers.get('referer');

  const candidateRaw = originHeader || refererHeader;
  const normalizedCandidate = normalizeOrigin(candidateRaw);

  const allowed = isOriginAllowed(normalizedCandidate);

  return {
    allowed,
    origin: normalizedCandidate,
  };
}
