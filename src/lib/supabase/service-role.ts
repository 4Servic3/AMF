import 'server-only';
import { createClient } from '@supabase/supabase-js';

let serviceRoleClientInstance: any = null;

/**
 * Retorna uma instância singleton do cliente Supabase com permissões de Service Role.
 * Estritamente server-only. Utilizado para webhooks e tarefas de segundo plano onde não há sessão de usuário.
 */
export function createServiceRoleClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Configuração do Supabase Service Role incompleta no servidor.');
  }

  if (!serviceRoleClientInstance) {
    serviceRoleClientInstance = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceRoleClientInstance;
}
