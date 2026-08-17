-- Migration: Stage 10 - Usuários, Acessos e Suporte

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE entitlement_status AS ENUM ('active', 'expired', 'revoked', 'pending');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE access_grant_status AS ENUM ('approved', 'rejected', 'pending');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_request_type AS ENUM ('access', 'correction', 'export', 'deletion', 'objection');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_request_status AS ENUM ('open', 'in_progress', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE profile_status AS ENUM ('active', 'suspended', 'anonymized');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- 2. Atualizar Profile
alter table profiles add column if not exists status profile_status default 'active' not null;
alter table profiles add column if not exists status_reason text;
alter table profiles add column if not exists suspended_at timestamp with time zone;
alter table profiles add column if not exists suspended_by uuid references auth.users(id) on delete set null;


-- 3. Entitlements Adaptation (Source of Truth)
-- O Entitlement passará a representar o "user_entitlements" do modelo pedido, suportando revogações.
alter table entitlements add column if not exists resource_type text default 'product' not null; -- 'product', 'course', 'path'
alter table entitlements add column if not exists status entitlement_status default 'active' not null;
alter table entitlements add column if not exists starts_at timestamp with time zone default timezone('utc'::text, now()) not null;
alter table entitlements add column if not exists ends_at timestamp with time zone; -- equivalent to old expires_at
-- If expires_at exists, migrate it to ends_at and drop expires_at (Optional but cleaner)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entitlements' AND column_name = 'expires_at') THEN
    UPDATE entitlements SET ends_at = expires_at WHERE ends_at IS NULL;
  END IF;
END $$;

alter table entitlements add column if not exists granted_by uuid references auth.users(id) on delete set null;
alter table entitlements add column if not exists grant_reason text;
alter table entitlements add column if not exists revoked_by uuid references auth.users(id) on delete set null;
alter table entitlements add column if not exists revoked_at timestamp with time zone;
alter table entitlements add column if not exists revoke_reason text;

drop trigger if exists update_entitlements_modtime on entitlements;
create trigger update_entitlements_modtime before update on entitlements for each row execute procedure update_modified_column();


-- 4. Access Grants (Pedidos Formais de Concessão Manual)
create table if not exists access_grants (
  id uuid default uuid_generate_v4() primary key,
  target_profile_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  reason text not null,
  duration_days integer, -- null means lifetime
  status access_grant_status default 'approved' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_access_grants_modtime on access_grants;
create trigger update_access_grants_modtime before update on access_grants for each row execute procedure update_modified_column();


-- 5. User Internal Notes (CRM Suporte)
create table if not exists user_internal_notes (
  id uuid default uuid_generate_v4() primary key,
  target_profile_id uuid references profiles(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null not null,
  content text not null, -- Sanitized plain text
  is_deleted boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_user_internal_notes_modtime on user_internal_notes;
create trigger update_user_internal_notes_modtime before update on user_internal_notes for each row execute procedure update_modified_column();


-- 6. LGPD - User Data Requests
create table if not exists user_data_requests (
  id uuid default uuid_generate_v4() primary key,
  requester_profile_id uuid references profiles(id) on delete cascade not null,
  type data_request_type not null,
  status data_request_status default 'open' not null,
  due_at timestamp with time zone,
  assigned_to uuid references auth.users(id) on delete set null,
  resolution text,
  evidence_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_user_data_requests_modtime on user_data_requests;
create trigger update_user_data_requests_modtime before update on user_data_requests for each row execute procedure update_modified_column();


-- 7. RLS
alter table access_grants enable row level security;
alter table user_internal_notes enable row level security;
alter table user_data_requests enable row level security;
alter table entitlements enable row level security;

-- Policies for Admin Access (Support Layer)
create policy "Admins can manage access_grants" on access_grants for all using (has_permission('users.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage user_internal_notes" on user_internal_notes for all using (has_permission('users.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage user_data_requests" on user_data_requests for all using (has_permission('users.manage') and (auth.jwt()->>'aal' = 'aal2'));

-- Entitlements already has RLS or will be updated. We assume users can view their own.
-- Drop and recreate specific select policy if necessary
drop policy if exists "Users can view own entitlements" on entitlements;
create policy "Users can view own entitlements" on entitlements for select using (auth.uid() = profile_id and status = 'active');
create policy "Admins can manage entitlements" on entitlements for all using (has_permission('users.manage') and (auth.jwt()->>'aal' = 'aal2'));

-- Student Client Security
-- Ensure students cannot insert into access_grants
-- The 'Admins can manage access_grants' policy uses has_permission, so regular students won't pass.
