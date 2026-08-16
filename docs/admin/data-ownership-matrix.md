# Matriz de Propriedade de Dados (AMF)

Abaixo estão os domínios de negócio, as entidades, e as regras de propriedade/acesso.

## 1. Usuários, Perfis e Acesso
- **Entidade**: `profiles`, instâncias de Autenticação.
- **Proprietário (Owner)**: O próprio usuário aluno/veterinário.
- **Permissões**:
  - Leitura: Perfil próprio pelo dono, e `admin` e `support` para todos.
  - Criação: Fluxo de signup público e `admin`.
  - Edição: Pelo dono (dados não críticos) e por `support`/`admin` (dados críticos, roles).
  - Exclusão: Soft-delete por `admin` (LGPD).
- **Dados Sensíveis**: Email, CRMV, data de nascimento.

## 2. Produtos, Preços e Entitlements
- **Entidades**: `products`, `product_prices`, `purchases`, `subscriptions`, `entitlements`.
- **Proprietário**: `finance_admin` e `super_admin`.
- **Permissões**:
  - Leitura: Público (`products`, `product_prices`), privado dono (`entitlements`, `purchases`), `admin` (tudo).
  - Edição/Criação: Somente `finance_admin` e `super_admin`. Nenhuma alteração destrutiva ou via cliente.
- **Origem do Status**: `entitlements` dita o acesso real (calculado a partir de subscriptions/purchases).

## 3. Casos da Semana (Stories)
- **Entidades**: `story_groups`, `story_items`, `story_categories`, `story_answers`.
- **Proprietário**: `clinical_reviewer`, `content_admin`.
- **Permissões**:
  - Criação/Edição: `content_admin` cria, `clinical_reviewer` revisa e publica.
  - Leitura: Usuários com `entitlement` válido. 1 preview grátis baseado em `free_preview_count`.
- **Retenção**: Alguns ficam em arquivo (`keep_in_archive = true`).

## 4. Academia e Cursos
- **Entidades**: `courses`, `course_modules`, `lessons`, `lesson_materials`, `lesson_progress`, `certificates`.
- **Proprietário**: `content_admin`.
- **Permissões**:
  - Edição/Publicação: `content_admin`.
  - Progresso: Escrito apenas pelo usuário (`profile_id`), acessível em relatórios por `admin`/`analyst`.

## 5. Operacional
- **Entidades**: `audit_logs`, `webhook_events`.
- **Proprietário**: Sistema / Imutável.
- **Permissões**:
  - Leitura: `super_admin`, `support_agent`.
  - Edição: Proibida. Nenhuma role pode modificar logs ou histórico de webhook.
