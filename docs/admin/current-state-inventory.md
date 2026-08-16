# Inventário do Estado Atual (AMF)

## 1. Stack e Infraestrutura
- **Framework**: Next.js 16.3.0 (App Router)
- **Linguagem**: TypeScript strict
- **Estilização**: Tailwind CSS v4, Lucide React
- **Gerenciador de Pacotes**: npm
- **Autenticação e Banco de Dados**: Supabase (PostgreSQL, Auth, Storage) usando `@supabase/ssr` e `@supabase/supabase-js`.
- **Hospedagem / Deploy**: Vercel
- **Versionamento**: GitHub

## 2. Estrutura do Repositório (Monorepo Físico)
O repositório concentra todo o código na raiz, com estrutura principal:
- `src/app`: Rotas da aplicação web do aluno.
  - Áreas mapeadas: `/` (home), `/entrar`, `/cadastro`, `/compra`, `/admin` (base existente).
- `src/components`: Componentes da interface (`ui/`, `layout/`, `academia/`, `casos/`, `home/`).
- `src/lib`: Bibliotecas auxiliares, instâncias do Supabase, services e models.
- `supabase/migrations`: Versionamento do banco de dados (5 migrations iniciais documentadas).

## 3. Inventário Supabase
### Tabelas e Entidades Principais
- **Usuários e Perfil**: `profiles`
- **Produtos e Vendas**: `products`, `product_prices`, `purchases`, `subscriptions`, `entitlements`
- **Cursos**: `courses`, `course_modules`, `lessons`, `lesson_materials`, `lesson_progress`, `user_notes`, `user_favorites`, `certificates`
- **Stories (Casos da Semana)**: `story_categories`, `story_groups`, `story_items`, `story_views`, `story_answers`
- **Sistema**: `notifications`, `notification_reads`, `webhook_events`, `audit_logs`

### RLS (Row Level Security)
- RLS ativada por padrão.
- Maioria das tabelas acessíveis para leitura pública e/ou atreladas via `auth.uid() = profile_id`.

## 4. Estado das Validações (Baseline)
- Typecheck: Existe um erro no `.next/dev/types/routes.d.ts` (TS1128) inerente aos tipos gerados pelo Next.js, não afeta código autoral diretamente.
- Lint: Rodando sem quebras bloqueantes críticas confirmadas na raiz.
- Sem segredos expostos. `NEXT_PUBLIC` restrito.
