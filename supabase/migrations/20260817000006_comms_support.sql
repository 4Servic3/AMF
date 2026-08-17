-- Migration: Stage 11 - Notificações, Helpdesk, Configurações Globais

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'push');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'review', 'approved', 'scheduled', 'sending', 'paused', 'completed', 'cancelled', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('queued', 'sent', 'delivered', 'opened', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- 2. Configurações Dinâmicas e Tipadas (Settings)
create table if not exists app_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  schema_version integer default 1 not null,
  description text,
  is_public boolean default false not null, -- If true, can be read by unauthenticated/students
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_app_settings_modtime on app_settings;
create trigger update_app_settings_modtime before update on app_settings for each row execute procedure update_modified_column();


-- 3. Notificações e Campanhas
create table if not exists notification_templates (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  channel notification_channel not null,
  subject text,
  body text not null,
  variables_schema jsonb default '[]'::jsonb,
  version integer default 1 not null,
  status text default 'draft' not null,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_notification_templates_modtime on notification_templates;
create trigger update_notification_templates_modtime before update on notification_templates for each row execute procedure update_modified_column();


create table if not exists notification_campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  template_id uuid references notification_templates(id) on delete restrict not null,
  channels notification_channel[] not null default '{in_app}', -- Allows multiple channels
  audience_definition jsonb not null, -- Segment rules
  schedule_at timestamp with time zone,
  timezone text default 'UTC',
  status campaign_status default 'draft' not null,
  estimated_recipients integer default 0,
  idempotency_key text unique,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_notification_campaigns_modtime on notification_campaigns;
create trigger update_notification_campaigns_modtime before update on notification_campaigns for each row execute procedure update_modified_column();


create table if not exists notification_deliveries (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references notification_campaigns(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade not null,
  channel notification_channel not null,
  status delivery_status default 'queued' not null,
  provider_message_id text,
  attempt_count integer default 0 not null,
  last_error text,
  sent_at timestamp with time zone,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(campaign_id, profile_id, channel) -- Prevent duplicate delivery per channel for the same campaign
);


-- 4. Helpdesk e Suporte (Tickets)
create table if not exists support_tickets (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  subject text not null,
  category text not null,
  priority ticket_priority default 'normal' not null,
  status ticket_status default 'open' not null,
  assignee_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_support_tickets_modtime on support_tickets;
create trigger update_support_tickets_modtime before update on support_tickets for each row execute procedure update_modified_column();


create table if not exists support_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete set null, -- Null means automated system message
  content text not null,
  is_internal boolean default false not null, -- CRITICAL: If true, client cannot read
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 5. RLS (Row Level Security)

-- Settings
alter table app_settings enable row level security;
create policy "Anyone can read public settings" on app_settings for select using (is_public = true);
create policy "Admins can manage settings" on app_settings for all using (has_permission('settings.manage') and (auth.jwt()->>'aal' = 'aal2'));

-- Communications
alter table notification_templates enable row level security;
alter table notification_campaigns enable row level security;
alter table notification_deliveries enable row level security;

create policy "Admins can manage templates" on notification_templates for all using (has_permission('communications.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage campaigns" on notification_campaigns for all using (has_permission('communications.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Users can read own deliveries" on notification_deliveries for select using (profile_id = auth.uid());
create policy "Admins can manage deliveries" on notification_deliveries for all using (has_permission('communications.manage'));

-- Support
alter table support_tickets enable row level security;
alter table support_messages enable row level security;

-- Users can only see their own tickets
create policy "Users can read own tickets" on support_tickets for select using (profile_id = auth.uid());
create policy "Users can create own tickets" on support_tickets for insert with check (profile_id = auth.uid());
create policy "Admins can manage tickets" on support_tickets for all using (has_permission('support.manage'));

-- Users can only see messages on their own tickets IF the message is NOT internal
create policy "Users can read public messages on own tickets" on support_messages for select using (
  is_internal = false and
  exists (select 1 from support_tickets where id = support_messages.ticket_id and profile_id = auth.uid())
);
create policy "Users can reply to own tickets" on support_messages for insert with check (
  is_internal = false and sender_id = auth.uid() and
  exists (select 1 from support_tickets where id = support_messages.ticket_id and profile_id = auth.uid())
);
create policy "Admins can manage messages" on support_messages for all using (has_permission('support.manage'));

