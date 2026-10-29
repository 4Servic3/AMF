import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/auth-user';

/**
 * O que o aluno autenticado pode abrir agora. Fonte única para catálogo, curso,
 * aula, planilha e casos: a regra mora no banco (member_access_summary) e esta
 * camada nunca concede acesso em caso de falha.
 */
export type MemberAccess = {
  state: 'anonymous' | 'ready' | 'unavailable';
  userId: string | null;
  courseIds: ReadonlySet<string>;
  productIds: ReadonlySet<string>;
  hasCasesAccess: boolean;
};

const EMPTY = new Set<string>();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function idSet(value: unknown): Set<string> | null {
  if (!Array.isArray(value)) return null;
  const ids = value.filter((id): id is string => typeof id === 'string' && UUID.test(id));
  return ids.length === value.length ? new Set(ids) : null;
}

export function closedAccess(state: MemberAccess['state'], userId: string | null): MemberAccess {
  return { state, userId, courseIds: EMPTY, productIds: EMPTY, hasCasesAccess: false };
}

/** Converte a resposta do RPC; qualquer formato inesperado fecha o acesso. */
export function parseAccessSummary(userId: string, raw: unknown): MemberAccess {
  if (!raw || typeof raw !== 'object') return closedAccess('unavailable', userId);
  const summary = raw as Record<string, unknown>;
  const courseIds = idSet(summary.courses);
  const productIds = idSet(summary.products);
  if (!courseIds || !productIds || typeof summary.cases !== 'boolean') return closedAccess('unavailable', userId);
  return { state: 'ready', userId, courseIds, productIds, hasCasesAccess: summary.cases };
}

/** Request-scoped: nunca compartilhado entre usuários. */
export const getMemberAccess = cache(async (): Promise<MemberAccess> => {
  let userId: string | null = null;
  try {
    const db = await createClient();
    const { data: { user }, error } = await getAuthUser();
    if (error || !user) return closedAccess('anonymous', null);
    userId = user.id;
    const { data, error: rpcError } = await db.rpc('member_access_summary');
    if (rpcError) return closedAccess('unavailable', userId);
    return parseAccessSummary(userId, data);
  } catch {
    return closedAccess('unavailable', userId);
  }
});
