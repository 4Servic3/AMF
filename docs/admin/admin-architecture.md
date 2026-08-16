# Arquitetura do Painel Administrativo

## Estrutura Proposta (Incremental)
O projeto atual está configurado em um repositório único, sem a estrutura de NPM Workspaces explícita, tendo o código contido primariamente em `src/`.

**Estratégia Recomendada:**
1. **Mantendo o projeto existente**: Criaremos a interface do Painel Administrativo usando um sub-path isolado como `/admin` dentro do App Router existente.
2. **Proteção Rigorosa no Middleware**: Todas as requisições para `/admin/*` serão interceptadas por um `middleware.ts` forte. Ele irá:
   - Validar a sessão do Supabase no servidor.
   - Requerer `AAL2` (MFA habilitado) em endpoints críticos de administração.
   - Verificar as permissões baseadas em Role-Based Access Control (RBAC).
3. **Migração Futura (Opcional)**: Em etapas futuras, e após a estabilização do admin, o monorepo pode ser convertido para Turborepo (ex: `apps/web` e `apps/admin`), compartilhando o `packages/ui`. Por hora, para reduzir o risco de quebrar o deploy da Vercel para os alunos, manteremos o código na estrutura atual.

## Camadas de Segurança e Isomorfismo
- **Frontend / Shell Administrativo**: Componentes dentro de `src/app/admin/...` e `src/components/admin/...`. UI separada visualmente do portal de alunos.
- **Camada de Autorização**: Helpers em `src/lib/authz/` que exportam constantes e regras lógicas de acesso.
- **BFF (Server Actions / Route Handlers)**: Operações sensíveis usarão Server Actions validando o usuário via `supabase-server` e fazendo check de RBAC usando o client de `service_role` apenas em contextos fechados ou preferencialmente confiando nas RLSs do Supabase configuradas para cada painel.

## Design e Acessibilidade
- Contrato visual focado em métricas, tabelas, modais e breadcrumbs.
- Fonte sans-serif e uso restrito dos tons institucionais (Ameixa, Teal, Dourado) em ações e acentos.
