# Matriz de RBAC (Role-Based Access Control)

Esta matriz define os papéis padrão do painel administrativo da AMF e as permissões (seeds) associadas a cada um, conforme o banco de dados.

## Permissões Disponíveis

| Chave (`key`) | Nível de Risco | Descrição |
| :--- | :--- | :--- |
| `dashboard.read` | Low | Acesso de leitura ao painel inicial administrativo. |
| `media.read` | Low | Leitura de biblioteca de mídias. |
| `media.manage` | Medium | Upload/exclusão de mídias. |
| `home.manage` | Medium | Gestão de banners e layout da Home do App. |
| `stories.publish` | Medium | Publicação de Casos da Semana. |
| `cases.review` | Medium | Revisão clínica de conteúdo. |
| `cases.publish` | Medium | Publicação de Casos clínicos detalhados. |
| `courses.manage` | Medium | Gestão de Cursos e Módulos. |
| `academy.manage` | Medium | Gestão de Trilhas da Academia. |
| `certificates.revoke`| High | Revogação de Certificados. |
| `users.read` | Low | Leitura de perfis de usuário. |
| `users.suspend` | High | Suspensão de conta de usuário. |
| `access.grant` | High | Concessão de acesso manual (premium). |
| `access.revoke` | High | Remoção de acesso premium. |
| `subscriptions.refund` | Critical | Estorno/Cancelamento forçado de assinaturas. |
| `notifications.send`| Medium | Envio de notificações push/email. |
| `support.read` | Low | Leitura de chamados e logs de acesso. |
| `settings.read` | Low | Leitura de configurações do app. |
| `settings.security_update` | Critical | Alteração de feature flags e configurações de segurança. |
| `reports.read` | Medium | Leitura de relatórios de uso e vendas. |
| `audit.read` | High | Leitura do histórico de logs imutáveis. |
| `roles.read` | Low | Leitura de roles e permissões. |
| `roles.assign` | Critical | Associação de papéis a administradores. |
| `data.export` | Critical | Exportação de planilhas/dados sensíveis. |

## Matriz de Papéis Base

| Papel (`role`) | Descrição | Permissões Mapeadas Inicialmente |
| :--- | :--- | :--- |
| **Super Admin** (`super_admin`) | Acesso irrestrito ao sistema. | **TODAS** as permissões listadas. Obrigatório MFA (AAL2) nas críticas. |
| **Content Admin** (`content_admin`) | Gestão de catálogo, casos e aulas. | `dashboard.read`, `media.read`, `media.manage`, `stories.publish`, `cases.publish`, `courses.manage`, `academy.manage`. |
| **Clinical Reviewer** (`clinical_reviewer`) | Revisão de veracidade clínica de casos e aulas. | `dashboard.read`, `cases.review`. |
| **Support Agent** (`support_agent`) | Atendimento N1 e investigação. | `dashboard.read`, `users.read`, `support.read`, `audit.read` (limitado ao escopo de suporte). |
| **Finance Admin** (`finance_admin`) | Acesso a vendas e assinaturas. | `dashboard.read`, `users.read`, `subscriptions.refund`, `reports.read`. |
| **Analyst** (`analyst`) | Leitura de logs e metrics. | `dashboard.read`, `reports.read`. |

> **Nota de Segurança:** Operações classificadas como `High` ou `Critical` exigem verificação adicional do token AAL2 (MFA ativado).
