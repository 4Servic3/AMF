/** Slugs dos produtos de lançamento (ver migration 20261021000000_commercial_access). */
export const PRODUCT_SLUGS = {
  imersao: 'imersao-clinica-de-felinos-parte-1',
  planilha: 'planilha-doses-seguras-felinos',
  casos: 'casos-clinicos',
} as const;

export type GatewayOrigin = 'casos' | 'cursos' | 'planilha' | 'home';
const ORIGINS: ReadonlySet<string> = new Set(['casos', 'cursos', 'planilha', 'home']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type GatewayTarget = { kind: 'product' | 'course'; slug: string };

/** Endereço único da tela de compra. Todo bloqueio do app aponta para cá. */
export function gatewayHref(target: GatewayTarget, origin: GatewayOrigin): string {
  const params = new URLSearchParams({ [target.kind === 'course' ? 'curso' : 'produto']: target.slug, origem: origin });
  return `/app/gateway?${params.toString()}`;
}

/** Lê os parâmetros da URL com validação; slugs inválidos são ignorados. */
export function parseGatewayParams(params: { produto?: string; curso?: string; origem?: string }): { target: GatewayTarget | null; origin: GatewayOrigin } {
  const origin = (params.origem && ORIGINS.has(params.origem) ? params.origem : 'home') as GatewayOrigin;
  if (params.produto && SLUG.test(params.produto)) return { target: { kind: 'product', slug: params.produto }, origin };
  if (params.curso && SLUG.test(params.curso)) return { target: { kind: 'course', slug: params.curso }, origin };
  return { target: null, origin };
}

/** Destino do botão "Voltar" da tela de compra. */
export function gatewayBackHref(origin: GatewayOrigin): string {
  return { casos: '/app/casos', cursos: '/app/cursos', planilha: '/app/produtos/planilha-doses-seguras-felinos', home: '/app' }[origin];
}

/** Aceita apenas checkout HTTPS e anexa o e-mail do aluno quando o provedor permite pré-preenchimento. */
export function checkoutLink(url: string | null | undefined, email?: string | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:') return null;
  if (email && !parsed.searchParams.has('email')) parsed.searchParams.set('email', email);
  return parsed.toString();
}

export function formatPrice(amountInCents: number | null | undefined, interval: string | null | undefined): string | null {
  if (typeof amountInCents !== 'number' || !Number.isFinite(amountInCents) || amountInCents <= 0) return null;
  const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountInCents / 100);
  const suffix = interval === 'month' ? ' por mês' : interval === 'year' ? ' por ano' : '';
  return value + suffix;
}
