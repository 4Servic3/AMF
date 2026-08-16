# Academia de Medicina Felina - MVP

Este é o repositório oficial da **Academia de Medicina Felina (AMF)**, uma área de membros premium voltada para médicos-veterinários e estudantes, focada na vivência clínica de felinos.

## Visão do Sistema
O MVP foi construído para entregar experiência de aplicativo de alta performance na Web, suporte a Progressive Web App (PWA) e controle fino de acessos baseado em *entitlements*.

**Stack Tecnológico:**
- Next.js (App Router)
- React 18
- TailwindCSS v4
- Supabase (PostgreSQL, Auth e Edge Functions)
- Vitest (Testes)
- jsPDF (Geração de Certificados Server-Side)

## Estrutura de Funcionalidades Principais
1. **Entitlements Seguros**: A arquitetura de permissões desvincula o ato da compra do direito de acesso, simplificando vendas casadas, bônus e cancelamentos.
2. **Cursos e Certificados**: Progresso salvo automaticamente (auto-save a cada 10s). Emissão de PDF programática via servidor de rotas, sem bloqueios de client-side.
3. **Casos da Semana (Close Friends)**: Uma visualização nativa de *Stories* verticais, com paywall contextual e limite dinâmico de *previews* por caso.
4. **Painel Admin**: Ambiente restrito com Checklist Clínico OBRIGATÓRIO (anonimização LGPD) antes da publicação de conteúdo de pacientes reais.
5. **Webhooks Idempotentes**: Endpoint de webhook (`/api/webhooks/payment`) já estruturado para ignorar duplicatas e garantir escalabilidade transacional em renovações de assinatura.

## Configuração do Ambiente e Execução
1. Copie o arquivo `.env.example` para `.env.local`.
2. Preencha as variáveis de ambiente necessárias, especialmente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   npm run dev
   ```

## Testes
O projeto utiliza `Vitest` para testes unitários isolados, como cálculos de paywall e motor de progressos.
```bash
npx vitest run
```

---

## Runbook de Operação Pós-Lançamento (MVP)

Caso enfrente problemas operacionais em produção, consulte este runbook rápido:

- **Problema**: Usuário comprou, mas não obteve acesso.
  **Solução**: Verifique no seu provedor (MercadoPago/LastLink) se o webhook foi enviado. Caso tenha falhado, a tabela `webhook_events` estará sem o registro de sucesso. Basta reenviar o evento manualmente na plataforma de pagamento ou inserir o acesso manualmente no painel admin (Módulo em breve).

- **Problema**: Webhook retornando erro 500 no Supabase.
  **Solução**: Certifique-se de que a `SUPABASE_SERVICE_ROLE_KEY` foi injetada no ambiente da Vercel. Operações dentro da rota do webhook precisam desviar das RLS de usuários normais.

- **Problema**: PWA não instala / "Add to Homescreen" não aparece.
  **Solução**: Verifique se o servidor está rodando em `https`. PWAs e Service Workers requerem conexão segura para funcionar.

## Checklist Obrigatório Antes de Produção
- [ ] Trocar os placeholders `/images/...` do arquivo de mock e banco por URLs de Storage finais.
- [ ] Inserir o logo oficial da Academia no topo (`Layout` e `PWA Icons`).
- [ ] Adicionar as imagens da Assinatura da Instrutora para o PDF do Certificado.
- [ ] Configurar credenciais reais do provedor de Vídeos (PandaVideo, Mux, etc).
- [ ] Testar uma transação de Sandbox completa antes de ligar a chave de produção.
