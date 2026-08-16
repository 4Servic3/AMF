# Plano de Ambientes e Backup (AMF)

## 1. Estratégia de Ambientes
O projeto usará ambientes isolados para garantir que testes administrativos não corrompam os dados dos alunos ou a produção.

- **Desenvolvimento Local**:
  - Banco de Dados: Instância local via `supabase start` ou projeto dev isolado na nuvem.
  - Váriaveis de Ambiente: `.env.local` contendo as chaves locais (`anon`, `service_role`).
  - Deploy: `localhost:3000`.

- **Preview / Staging**:
  - Hospedagem: Vercel Preview Deployments atrelados a Pull Requests.
  - Banco de Dados: Projeto Supabase dedicado ao Staging (sem dados reais de produção).
  - Váriaveis: Configurado na Vercel no environment `Preview`.
  - Dados: Dados sintéticos inseridos por scripts de seed. **Proibida cópia de dados PII reais de produção para staging**.

- **Produção**:
  - Banco de Dados: Projeto Supabase principal (AMF Production).
  - Váriaveis: `Production` na Vercel.
  - Deployments: Branch `main`.

## 2. Estratégia de Backup (Database e Storage)

### Procedimento de Backup Lógico (Pré-Migrations de Risco)
Sempre que o plano de migração envolver tabelas sensíveis (como `profiles`, `purchases` ou `entitlements`), realizar backup antes:
1. Usar CLI do Supabase (ou `pg_dump`) para gerar dump de schema e data:
   `supabase db dump -f backup_YYYYMMDD.sql --db-url [URL_PROD]`
2. Confirmar integridade do dump antes de aplicar as novas migrations na Vercel/Produção.

### Backup de Storage (Buckets Premium)
- Arquivos sensíveis de `lesson_materials` e `courses` (bucket privado).
- Estabelecer rotina de snapshot via script secundário ou AWS S3 Sync em serviços de arquivamento.

## 3. Checklist de Restauração Testável
1. Iniciar instância Supabase local ou branch.
2. Executar `supabase db restore backup_YYYYMMDD.sql`.
3. Validar se a query de Entitlements retorna a quantidade exata de usuários ativos (teste de sanidade).
4. Em caso positivo, confirmar que o snapshot lógico atende aos requisitos de Rollback.
