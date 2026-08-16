-- Migration: Stage 2 - Banco Administrativo, Migrations, RBAC e Auditoria

-- Enable UUID extension (fallback if not enabled)
create extension if not exists "uuid-ossp";

-- Helper function for updated_at (fallback if not created by initial schema)
create or replace function public.update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 1. Admin Roles
create table if not exists admin_roles (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  name text not null,
  description text,
  is_system boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Admin Permissions
DO $$ BEGIN
    CREATE TYPE permission_risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists admin_permissions (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null, -- format: resource.action
  resource text not null,
  action text not null,
  description text,
  risk_level permission_risk_level default 'low' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Admin Role Permissions
create table if not exists admin_role_permissions (
  role_id uuid references admin_roles on delete cascade not null,
  permission_id uuid references admin_permissions on delete cascade not null,
  granted_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (role_id, permission_id)
);

-- 4. Admin User Roles
DO $$ BEGIN
    CREATE TYPE admin_user_role_status AS ENUM ('invited', 'active', 'suspended', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists admin_user_roles (
  user_id uuid references auth.users on delete cascade not null,
  role_id uuid references admin_roles on delete cascade not null,
  status admin_user_role_status default 'active' not null,
  granted_by uuid references auth.users on delete set null,
  granted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  revoke_reason text,
  primary key (user_id, role_id)
);

-- 5. Admin Invitations
create table if not exists admin_invitations (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  role_ids uuid[] not null, -- Array of roles to grant
  token_hash text unique not null, -- Never store raw token!
  invited_by uuid references auth.users on delete set null,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Audit Logs Refactoring (Append-only)
-- Rename existing table to preserve data but adopt new structure
alter table if exists audit_logs rename to admin_audit_logs;

-- If table didn't exist, create it (fallback)
create table if not exists admin_audit_logs (
  id uuid default uuid_generate_v4() primary key,
  actor_id uuid references auth.users on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add new columns for enhanced auditing
alter table admin_audit_logs add column if not exists occurred_at timestamp with time zone default timezone('utc'::text, now()) not null;
alter table admin_audit_logs add column if not exists actor_roles_snapshot jsonb;
alter table admin_audit_logs add column if not exists request_id text;
alter table admin_audit_logs add column if not exists ip_hash text;
alter table admin_audit_logs add column if not exists user_agent text;
alter table admin_audit_logs add column if not exists reason text;
alter table admin_audit_logs add column if not exists result text default 'success';
alter table admin_audit_logs add column if not exists error_code text;
alter table admin_audit_logs add column if not exists before_data jsonb;
alter table admin_audit_logs add column if not exists after_data jsonb;

-- Prevent UPDATE or DELETE on admin_audit_logs
create or replace function prevent_audit_log_modification()
returns trigger as $$
begin
  raise exception 'Modification of audit logs is strictly prohibited.';
end;
$$ language plpgsql;

drop trigger if exists tr_prevent_audit_log_modification on admin_audit_logs;
create trigger tr_prevent_audit_log_modification
  before update or delete on admin_audit_logs
  for each row execute function prevent_audit_log_modification();

-- 7. Content Versions
create table if not exists content_versions (
  id uuid default uuid_generate_v4() primary key,
  entity_type text not null,
  entity_id uuid not null,
  version_number integer not null,
  snapshot jsonb not null,
  change_summary text,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(entity_type, entity_id, version_number)
);

-- 8. Content Reviews
DO $$ BEGIN
    CREATE TYPE content_review_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists content_reviews (
  id uuid default uuid_generate_v4() primary key,
  entity_type text not null,
  entity_id uuid not null,
  status content_review_status default 'pending' not null,
  reviewer_id uuid references auth.users on delete set null,
  requested_by uuid references auth.users on delete set null,
  notes text,
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone
);

-- 9. Publication Schedules
DO $$ BEGIN
    CREATE TYPE publication_schedule_status AS ENUM ('scheduled', 'running', 'completed', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists publication_schedules (
  id uuid default uuid_generate_v4() primary key,
  entity_type text not null,
  entity_id uuid not null,
  publish_at timestamp with time zone not null,
  unpublish_at timestamp with time zone,
  timezone text default 'UTC' not null,
  status publication_schedule_status default 'scheduled' not null,
  created_by uuid references auth.users on delete set null,
  approved_by uuid references auth.users on delete set null,
  last_error text,
  idempotency_key text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Feature Flags & App Settings
DO $$ BEGIN
    CREATE TYPE setting_risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  environment text default 'production' not null,
  description text,
  risk_level setting_risk_level default 'low' not null,
  updated_by uuid references auth.users on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Webhook Events & Background Jobs
-- Create webhook_events if it doesn't exist (fallback)
create table if not exists webhook_events (
  id uuid default uuid_generate_v4() primary key,
  provider text not null,
  external_id text not null,
  type text not null,
  payload jsonb not null,
  status text default 'pending',
  processed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(provider, external_id)
);

-- Alter existing or newly created webhook_events to add new columns
alter table webhook_events add column if not exists attempts integer default 0 not null;
alter table webhook_events add column if not exists payload_hash text;
alter table webhook_events add column if not exists received_at timestamp with time zone default timezone('utc'::text, now()) not null;
alter table webhook_events add column if not exists last_error text;

create table if not exists background_jobs (
  id uuid default uuid_generate_v4() primary key,
  queue_name text default 'default' not null,
  job_type text not null,
  payload jsonb not null,
  status text default 'pending' not null,
  attempts integer default 0 not null,
  max_attempts integer default 3 not null,
  run_at timestamp with time zone default timezone('utc'::text, now()) not null,
  locked_at timestamp with time zone,
  locked_by_worker text,
  last_error text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance and RLS
create index if not exists idx_admin_role_perms_role on admin_role_permissions(role_id);
create index if not exists idx_admin_user_roles_user on admin_user_roles(user_id);
create index if not exists idx_admin_user_roles_status on admin_user_roles(status);
create index if not exists idx_audit_logs_actor on admin_audit_logs(actor_id);
create index if not exists idx_audit_logs_resource on admin_audit_logs(resource_type, resource_id);
create index if not exists idx_content_versions_entity on content_versions(entity_type, entity_id);
create index if not exists idx_content_reviews_entity on content_reviews(entity_type, entity_id);

-- --- RBAC HELPER FUNCTION ---
-- Function to check if current user has a specific permission
create or replace function public.has_permission(required_permission text)
returns boolean
security definer
set search_path = public
as $$
declare
  has_access boolean;
begin
  select exists (
    select 1
    from admin_user_roles aur
    join admin_role_permissions arp on aur.role_id = arp.role_id
    join admin_permissions ap on arp.permission_id = ap.id
    where aur.user_id = auth.uid()
      and aur.status = 'active'
      and (aur.expires_at is null or aur.expires_at > now())
      and ap.key = required_permission
  ) into has_access;
  
  return has_access;
end;
$$ language plpgsql stable;

-- Prevent the last superadmin from being removed or suspended
create or replace function public.prevent_last_superadmin_removal()
returns trigger as $$
declare
  superadmin_role_id uuid;
  superadmin_count int;
begin
  select id into superadmin_role_id from admin_roles where key = 'super_admin';
  
  if (TG_OP = 'DELETE' and OLD.role_id = superadmin_role_id) or 
     (TG_OP = 'UPDATE' and OLD.role_id = superadmin_role_id and NEW.status != 'active') then
     
    select count(*) into superadmin_count from admin_user_roles where role_id = superadmin_role_id and status = 'active';
    if superadmin_count <= 1 then
      raise exception 'Cannot remove or suspend the last active super_admin.';
    end if;
  end if;
  
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

drop trigger if exists tr_prevent_last_superadmin_removal on admin_user_roles;
create trigger tr_prevent_last_superadmin_removal
  before delete or update on admin_user_roles
  for each row execute function prevent_last_superadmin_removal();

-- --- ROW LEVEL SECURITY (RLS) ---
alter table admin_roles enable row level security;
alter table admin_permissions enable row level security;
alter table admin_role_permissions enable row level security;
alter table admin_user_roles enable row level security;
alter table admin_invitations enable row level security;
alter table admin_audit_logs enable row level security;
alter table content_versions enable row level security;
alter table content_reviews enable row level security;
alter table publication_schedules enable row level security;
alter table app_settings enable row level security;
alter table background_jobs enable row level security;

-- Policies for Admin Roles & Permissions (Read only for users with 'roles.read')
create policy "Read roles with roles.read" on admin_roles for select using (has_permission('roles.read'));
create policy "Read permissions with roles.read" on admin_permissions for select using (has_permission('roles.read'));
create policy "Read role_perms with roles.read" on admin_role_permissions for select using (has_permission('roles.read'));
create policy "Read user_roles with users.read" on admin_user_roles for select using (has_permission('users.read'));

-- High risk mutation policies require AAL2 and explicit permission
create policy "Assign roles with roles.assign and AAL2" on admin_user_roles for insert 
  with check (has_permission('roles.assign') and (auth.jwt()->>'aal' = 'aal2'));
  
create policy "Update roles with roles.assign and AAL2" on admin_user_roles for update 
  using (has_permission('roles.assign') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Delete roles with roles.assign and AAL2" on admin_user_roles for delete 
  using (has_permission('roles.assign') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Read audit logs with audit.read" on admin_audit_logs for select using (has_permission('audit.read'));
-- Insert on audit_logs should only be done via secure server endpoints (service_role)
create policy "No direct insert on audit logs via app" on admin_audit_logs for insert with check (false);

create policy "Read app_settings with settings.read" on app_settings for select using (has_permission('settings.read'));
create policy "Update app_settings with settings.update and AAL2" on app_settings for update 
  using (has_permission('settings.update') and (auth.jwt()->>'aal' = 'aal2'));

-- General Content Policies (example for versions/reviews)
create policy "Read content versions with content.read" on content_versions for select using (has_permission('dashboard.read'));
create policy "Read content reviews with content.read" on content_reviews for select using (has_permission('dashboard.read'));


-- --- SEEDS ---
-- Insert Permissions
insert into admin_permissions (key, resource, action, risk_level, description) values
('dashboard.read', 'dashboard', 'read', 'low', 'Access administrative dashboard'),
('media.read', 'media', 'read', 'low', 'Read media files'),
('media.manage', 'media', 'manage', 'medium', 'Upload and delete media'),
('home.manage', 'home', 'manage', 'medium', 'Manage home banners and layout'),
('stories.publish', 'stories', 'publish', 'medium', 'Publish stories'),
('cases.review', 'cases', 'review', 'medium', 'Review clinical cases'),
('cases.publish', 'cases', 'publish', 'medium', 'Publish clinical cases'),
('courses.manage', 'courses', 'manage', 'medium', 'Manage courses'),
('academy.manage', 'academy', 'manage', 'medium', 'Manage academy tracks'),
('certificates.revoke', 'certificates', 'revoke', 'high', 'Revoke certificates'),
('users.read', 'users', 'read', 'low', 'Read user profiles'),
('users.suspend', 'users', 'suspend', 'high', 'Suspend users'),
('access.grant', 'access', 'grant', 'high', 'Grant premium access'),
('access.revoke', 'access', 'revoke', 'high', 'Revoke premium access'),
('subscriptions.refund', 'subscriptions', 'refund', 'critical', 'Refund subscriptions'),
('notifications.send', 'notifications', 'send', 'medium', 'Send push/email notifications'),
('support.read', 'support', 'read', 'low', 'Read support tickets'),
('settings.read', 'settings', 'read', 'low', 'Read app settings'),
('settings.security_update', 'settings', 'security_update', 'critical', 'Update security settings'),
('reports.read', 'reports', 'read', 'medium', 'Read financial and usage reports'),
('audit.read', 'audit', 'read', 'high', 'Read audit logs'),
('roles.read', 'roles', 'read', 'low', 'Read admin roles'),
('roles.assign', 'roles', 'assign', 'critical', 'Assign or revoke admin roles'),
('data.export', 'data', 'export', 'critical', 'Export sensitive data')
on conflict (key) do nothing;

-- Insert Base Roles
insert into admin_roles (key, name, description, is_system) values
('super_admin', 'Super Admin', 'Full access to all systems', true),
('content_admin', 'Content Admin', 'Manage courses and stories', false),
('clinical_reviewer', 'Clinical Reviewer', 'Review and approve clinical cases', false),
('support_agent', 'Support Agent', 'Assist users and read logs', false),
('finance_admin', 'Finance Admin', 'Manage subscriptions and refunds', false),
('analyst', 'Analyst', 'Read reports and metrics', false)
on conflict (key) do nothing;

-- Grant ALL permissions to super_admin
do $$
declare
  super_admin_id uuid;
begin
  select id into super_admin_id from admin_roles where key = 'super_admin';
  
  insert into admin_role_permissions (role_id, permission_id)
  select super_admin_id, id from admin_permissions
  on conflict do nothing;
end $$;

-- Grant specific permissions to content_admin
do $$
declare
  content_admin_id uuid;
begin
  select id into content_admin_id from admin_roles where key = 'content_admin';
  
  insert into admin_role_permissions (role_id, permission_id)
  select content_admin_id, id from admin_permissions 
  where key in ('dashboard.read', 'media.read', 'media.manage', 'stories.publish', 'cases.publish', 'courses.manage', 'academy.manage')
  on conflict do nothing;
end $$;

-- Triggers for updated_at
drop trigger if exists update_admin_roles_modtime on admin_roles;
create trigger update_admin_roles_modtime before update on admin_roles for each row execute procedure update_modified_column();

drop trigger if exists update_pub_schedules_modtime on publication_schedules;
create trigger update_pub_schedules_modtime before update on publication_schedules for each row execute procedure update_modified_column();

drop trigger if exists update_app_settings_modtime on app_settings;
create trigger update_app_settings_modtime before update on app_settings for each row execute procedure update_modified_column();

