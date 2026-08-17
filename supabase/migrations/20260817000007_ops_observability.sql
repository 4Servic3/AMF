-- Migration: Stage 12 - Observabilidade, Relatórios Seguros, Webhooks e Jobs

-- 1. Webhooks (Gateway Agnostic, Prepared for Mercado Pago)
create table if not exists webhook_events (
  id uuid default uuid_generate_v4() primary key,
  provider text default 'mercadopago' not null,
  external_id text not null, -- MP Event ID or Topic ID
  topic text not null, -- MP topic (e.g., 'payment', 'subscription')
  payload jsonb not null,
  status text default 'pending' not null, -- 'pending', 'processing', 'completed', 'failed', 'ignored'
  signature_verified boolean default false not null,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone,
  unique(provider, external_id) -- Idempotency constraint against duplicate webhooks
);

create index if not exists idx_webhook_events_status on webhook_events(status);


-- 2. Background Jobs (Operações em Lote e Reconciliações)
create table if not exists background_jobs (
  id uuid default uuid_generate_v4() primary key,
  job_type text not null, -- 'webhook_processor', 'certificate_generator', 'notification_sender'
  payload jsonb default '{}'::jsonb not null,
  status text default 'queued' not null, -- 'queued', 'running', 'completed', 'failed'
  priority integer default 0 not null,
  attempt_count integer default 0 not null,
  max_attempts integer default 3 not null,
  last_error text,
  locked_by uuid references auth.users(id) on delete set null, -- Nullable, can be system worker ID
  locked_at timestamp with time zone,
  run_after timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

create index if not exists idx_webhook_events_queue on background_jobs(status, run_after) where status = 'queued';


-- 3. Views Analíticas Seguras (Security Invoker)
-- As views delegam as permissões ao invocador. Só quem possui acesso às tabelas base conseguirá ler o agrupamento.

-- Relatório Financeiro (Resumo de Vendas e Assinaturas)
create or replace view v_reports_finances with (security_invoker = true) as
select 
  date_trunc('day', p.created_at) as day,
  count(p.id) as total_purchases,
  sum(p.amount_paid) as revenue_cents,
  p.status
from purchases p
group by 1, 4;

-- Relatório de Usuários (Cadastros vs Suspensões)
create or replace view v_reports_users with (security_invoker = true) as
select 
  date_trunc('day', created_at) as day,
  status,
  count(id) as total
from profiles
group by 1, 2;

-- Relatório de Academia e Casos (Progresso de Entitlements Ativos)
create or replace view v_reports_entitlements with (security_invoker = true) as
select 
  resource_type,
  status,
  count(id) as total_granted
from entitlements
group by 1, 2;


-- 4. RLS para Operações Administrativas
alter table webhook_events enable row level security;
alter table background_jobs enable row level security;

-- Apenas sistema (Service Role) insere webhooks (via Edge Function) e Jobs
-- Admins com permissão podem ler e solicitar reprocessamento
create policy "Admins can read webhooks" on webhook_events for select using (has_permission('ops.manage'));
create policy "Admins can manage webhooks" on webhook_events for all using (has_permission('ops.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Admins can read jobs" on background_jobs for select using (has_permission('ops.manage'));
create policy "Admins can manage jobs" on background_jobs for all using (has_permission('ops.manage') and (auth.jwt()->>'aal' = 'aal2'));
