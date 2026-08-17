# Matriz Obrigatória de Navegação e Funcionalidade (Admin)

Contrato de Não Regressão. Nenhuma destas rotas ou ações pode ser quebrada durante as etapas de redesign.

| Área | Item Visível | Rota Real Atual | Componente/Página | Permissão Exigida | Fonte de Dados | Ações Disponíveis | Server Action/RPC | Status Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Painel** | Painel de controle | `/admin` | `page.tsx` | `AAL2` (básico) | `profiles`, `purchases` | Visualizar métricas mockadas (preparado) | `N/A` | ✅ Passou |
| **Conteúdo** | Home e banners | `/admin/home` | `page.tsx` | `content.manage` | `global_options` | Editar banners, Cursos em destaque | `saveHomeConfig` | ✅ Passou |
| **Conteúdo** | Stories | `/admin/stories` | `page.tsx` | `content.manage` | `story_groups`, `items`| Agendar stories, gerenciar acervo | `saveStory` | ✅ Passou |
| **Conteúdo** | Casos Clínicos | `/admin/cases` | `page.tsx` | `cases.manage` | `cases` | Listar casos, buscar, enviar p/ revisão | `N/A` | ✅ Passou |
| **Conteúdo** | Editor de Caso | `/admin/cases/editor/[id]`| `page.tsx` | `cases.manage` | `cases`, `chapters` | Rascunho, aprovar (Four-eyes), rejeitar | `saveCaseDraft`, `approveCase` | ✅ Passou |
| **Conteúdo** | Cursos | `/admin/courses` | `page.tsx` | `courses.manage` | `courses` | Listar cursos, gerenciar catálogo | `N/A` | ✅ Passou |
| **Conteúdo** | Editor de Curso | `/admin/courses/editor/[id]`| `page.tsx` | `courses.manage` | `courses`, `modules`, `lessons` | Salvar módulos, vincular quiz global | `saveCourse`, `saveGlobalQuestion`| ✅ Passou |
| **Conteúdo** | Academia | `/admin/academy` | `page.tsx` | `academy.manage` | `academy_paths` | Construir trilha, gerenciar fases | `N/A` | ✅ Passou |
| **Conteúdo** | Certificados | `/admin/certificates`| `page.tsx` | `academy.manage` | `certificates` | Listar emissoes, revogar certificado | `revokeCertificate` | ✅ Passou |
| **Conteúdo** | Biblioteca de mídias| `/admin/media` | `page.tsx` | `media.manage` | `Storage`, `media_assets`| Upload, deleção, cópia de URL | `requestUploadUrl` | ✅ Passou |
| **Usuários** | Usuários | `/admin/users` | `page.tsx` | `users.manage` | `profiles` | Busca, bloqueio | `N/A` | ✅ Passou |
| **Usuários** | CRM Detalhe | `/admin/users/[id]`| `client.tsx` | `users.manage` | `entitlements`, `tickets` | Suspender, Anonimizar (LGPD), Logs | `anonymizeUser`, `grantAccess` | ✅ Passou |
| **Comunicação**| Notificações | `/admin/communications`| `page.tsx` | `communications.manage`| `notification_campaigns` | Disparo multicanal (In-App/Email) | `createCampaign`, `pauseCampaign` | ✅ Passou |
| **Suporte** | Tickets | `/admin/support` | `page.tsx` | `support.manage` | `support_tickets` | Fila de atendimento | `N/A` | ✅ Passou |
| **Suporte** | Ticket Chat | `/admin/support/[id]`| `page.tsx` | `support.manage` | `support_messages` | Resposta pública, Nota Interna | `replyToTicket` | ✅ Passou |
| **Operações**| Relatórios | `/admin/reports` | `page.tsx` | `reports.read` | `v_reports_*` (Views) | Visualizar gráficos agregados | `N/A` | ✅ Passou |
| **Operações**| Monitoramento | `/admin/operations`| `page.tsx` | `ops.manage` | `webhook_events`, `jobs` | Reprocessar Webhook, Retry de Job | `reprocessWebhook`, `requeueJob` | ✅ Passou |
| **Governança** | Configurações | `/admin/settings` | `page.tsx` | `settings.manage` | `app_settings` | Modo manutenção, Force Logout All | `saveSetting`, `forceLogoutAllUsers` | ✅ Passou |
| **Governança** | Auditoria | `/admin/audit` | `page.tsx` | `audit.read` | `admin_audit_logs` | Exportar logs sanitizados CSV | `exportAuditLogsCSV` | ✅ Passou |

---
*Assinatura do Contrato de Baseline Funcional: Todos os itens estão operantes, tipados e passando no Build (TypeScript).*
