# Schema Administrativo (Etapa 2)

Abaixo está o modelo atualizado de entidades para o RBAC e auditoria.

## Diagrama de Relacionamento (ERD)

```mermaid
erDiagram
    auth_users ||--o{ admin_user_roles : has
    auth_users ||--o{ admin_audit_logs : "actor (optional)"
    auth_users ||--o{ content_versions : created_by
    auth_users ||--o{ content_reviews : reviewer_or_requestor

    admin_roles ||--o{ admin_user_roles : granted_to
    admin_roles ||--o{ admin_role_permissions : possesses
    admin_permissions ||--o{ admin_role_permissions : granted_via
    
    admin_roles {
        uuid id PK
        text key UK
        text name
        boolean is_system
    }

    admin_permissions {
        uuid id PK
        text key UK
        text resource
        text action
        enum risk_level
    }

    admin_user_roles {
        uuid user_id PK, FK
        uuid role_id PK, FK
        enum status
        timestamp expires_at
    }

    admin_audit_logs {
        uuid id PK
        uuid actor_id FK
        text action
        text resource_type
        jsonb actor_roles_snapshot
        jsonb before_data
        jsonb after_data
    }
```

## Resumo das Novas Entidades

1. **RBAC (`admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_user_roles`)**: Centraliza o controle de acesso por usuários da base Supabase. As RLS validam contra `has_permission()`.
2. **Convites (`admin_invitations`)**: Evita criação prévia de contas antes do funcionário aceitar o papel.
3. **Auditoria Refinada (`admin_audit_logs`)**: Herdada da `audit_logs` inicial, agora como tabela *Append-Only* com trigger estrito bloqueando deletes ou updates até mesmo para super admins na aplicação. Armazena o "antes/depois" (diff) e os papeis no momento da ação (snapshot) para histórico perfeito.
4. **Governança de Conteúdo (`content_versions`, `content_reviews`, `publication_schedules`)**: Viabiliza aprovação de conteúdo clínico antes de ir a público e agendamento de posts (Stories).
5. **Ajustes Adicionais**: Tabelas `webhook_events` melhoradas (retries/hashes), e `feature_flags`/`app_settings` com governança RLS e suporte a AAL2.
