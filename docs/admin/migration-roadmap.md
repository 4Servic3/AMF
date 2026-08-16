# Roadmap de Migrations Administrativas

O processo de criação do Painel Administrativo exigirá as seguintes fases de migrations de banco de dados, desenhadas para manter compatibilidade reversa temporária e garantir RLS segura.

## Etapa 2: Banco Administrativo, Migrations e RBAC
- **Migration `000005_rbac_schema`**:
  - Tabela `admin_roles` e `admin_permissions`.
  - Associação M:N em `profile_admin_roles`.
  - Functions no Supabase (RPC) para validar rapidamente se um usuário (via `auth.uid()`) detém a permissão necessária, ex: `has_permission('courses.publish')`.
- **Risco**: Baixo/Médio (adiciona schemas novos).
- **Rollback**: Drop das tabelas novas e funções.

## Etapa 3: Autenticação Administrativa e MFA
- **Migration `000006_mfa_policies`**:
  - Ajustar RLS de `profiles` e tabelas sensíveis para validar `auth.jwt() -> 'aal' = 'aal2'` nas ações administrativas.
- **Risco**: Alto (impacta policies).
- **Rollback**: Reversão do check de `aal2` via migration de downgrade.

## Etapa 5: Storage Administrativo
- **Migration `000007_storage_policies`**:
  - Regras no `storage.objects` permitindo CRUD total para perfis que tenham `has_permission('media.manage')`.
  - Configuração rigorosa para evitar que administradores deletem buckets inteiros.

## Regras de Execução (Contrato)
- Toda alteração destrutiva (ex: exclusão da coluna `is_published` em prol da nova coluna `status`) deve ocorrer no modelo *Expand-Migrate-Contract*:
  1. Cria-se a coluna nova (`status`).
  2. Migram-se os dados (trigger de fallback ou backfill job).
  3. Altera-se o app para usar a coluna nova.
  4. Num futuro release, dropa-se a coluna antiga.
- Nenhuma migration destrutiva irreversível ocorrerá neste pacote de 13 etapas para garantir estabilidade da base atual de alunos.
