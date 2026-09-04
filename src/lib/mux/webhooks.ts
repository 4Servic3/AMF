import 'server-only';
import { getMuxClient } from './client';
import { getMuxCredentials } from './config';

export interface WebhookMetrics {
  totalReceived: number;
  verified: number;
  invalidSignature: number;
  timestampTooOld: number;
  duplicates: number;
  processed: number;
  failed: number;
}

const metrics: WebhookMetrics = {
  totalReceived: 0,
  verified: 0,
  invalidSignature: 0,
  timestampTooOld: 0,
  duplicates: 0,
  processed: 0,
  failed: 0,
};

export function getWebhookMetrics(): WebhookMetrics {
  return { ...metrics };
}

export function recordWebhookMetric(metric: keyof WebhookMetrics): void {
  metrics[metric] += 1;
}

export function resetWebhookMetrics(): void {
  metrics.totalReceived = 0;
  metrics.verified = 0;
  metrics.invalidSignature = 0;
  metrics.timestampTooOld = 0;
  metrics.duplicates = 0;
  metrics.processed = 0;
  metrics.failed = 0;
}

/**
 * Valida a assinatura HMAC SHA-256 do webhook do Mux utilizando o SDK oficial.
 * Compara em tempo constante e aplica tolerância máxima de 300 segundos (5 minutos) contra ataques de repetição.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  headers: Headers | Record<string, string | null | undefined>
): Promise<{ valid: boolean; error?: string }> {
  recordWebhookMetric('totalReceived');

  const creds = getMuxCredentials();
  if (!creds.webhookSecret) {
    recordWebhookMetric('invalidSignature');
    return { valid: false, error: 'Chave secreta de webhook não configurada.' };
  }

  const client = getMuxClient();

  // Converte Headers do Fetch para objeto legível pelo SDK do Mux se necessário
  const headerMap: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((val, key) => {
      headerMap[key.toLowerCase()] = val;
    });
  } else {
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string') {
        headerMap[k.toLowerCase()] = v;
      }
    }
  }

  const sigHeader = headerMap['mux-signature'];
  if (!sigHeader) {
    recordWebhookMetric('invalidSignature');
    return { valid: false, error: 'Cabeçalho mux-signature ausente.' };
  }

  try {
    await client.webhooks.verifySignature(rawBody, headerMap, creds.webhookSecret);
    recordWebhookMetric('verified');
    return { valid: true };
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('too old')) {
      recordWebhookMetric('timestampTooOld');
    } else {
      recordWebhookMetric('invalidSignature');
    }
    return { valid: false, error: 'Assinatura do webhook inválida ou expirada.' };
  }
}
