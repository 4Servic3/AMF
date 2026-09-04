import 'server-only';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Rate limiter em memória com janela deslizante por chave.
 * Adequado para proteção de endpoints administrativos sensíveis (ex: criação de uploads).
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 10 * 60 * 1000 // 10 minutos
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Utilitário de teste para limpar o estado de rate limit.
 */
export function resetRateLimitStore(): void {
  memoryStore.clear();
}
