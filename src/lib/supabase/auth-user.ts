import 'server-only';
import { cache } from 'react';
import { createClient } from './server';

/**
 * Usuário validado pelo Supabase Auth (getUser, nunca getSession), uma vez por
 * requisição. React cache é por requisição: nada é compartilhado entre alunos.
 */
export const getAuthUser = cache(async () => (await createClient()).auth.getUser());
