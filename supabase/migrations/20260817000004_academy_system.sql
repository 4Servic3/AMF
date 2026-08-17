-- Migration: Stage 9 - Academia, Trilhas, Pré-requisitos e Certificados Avançados

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE academy_path_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE phase_completion_rule AS ENUM ('all', 'percentage', 'manual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE step_type AS ENUM ('course', 'module', 'lesson', 'case', 'quiz', 'live', 'custom');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prerequisite_rule AS ENUM ('completed', 'min_score', 'percentage', 'date');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE certificate_status AS ENUM ('issued', 'revoked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- 2. Trilhas (Academy Paths)
create table if not exists academy_paths (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  description text,
  cover_asset_id uuid references media_assets(id) on delete set null,
  accent_color text,
  estimated_weeks integer default 4,
  status academy_path_status default 'draft' not null,
  required_entitlement_id uuid references entitlements(id) on delete set null,
  version integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_academy_paths_modtime on academy_paths;
create trigger update_academy_paths_modtime before update on academy_paths for each row execute procedure update_modified_column();

drop trigger if exists increment_academy_paths_version on academy_paths;
create trigger increment_academy_paths_version before update on academy_paths for each row execute procedure increment_version();


-- 3. Fases e Passos (Phases & Steps)
create table if not exists academy_phases (
  id uuid default uuid_generate_v4() primary key,
  path_id uuid references academy_paths(id) on delete cascade not null,
  title text not null,
  description text,
  position integer not null default 0,
  estimated_minutes integer,
  completion_rule phase_completion_rule default 'all' not null,
  required_percentage integer default 100,
  status academy_path_status default 'published' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_academy_phases_modtime on academy_phases;
create trigger update_academy_phases_modtime before update on academy_phases for each row execute procedure update_modified_column();

create table if not exists academy_steps (
  id uuid default uuid_generate_v4() primary key,
  phase_id uuid references academy_phases(id) on delete cascade not null,
  position integer not null default 0,
  step_type step_type not null,
  target_id uuid not null, -- ID of course, lesson, case, etc.
  title_override text,
  is_required boolean default true not null,
  unlock_at timestamp with time zone,
  status academy_path_status default 'published' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_academy_steps_modtime on academy_steps;
create trigger update_academy_steps_modtime before update on academy_steps for each row execute procedure update_modified_column();


-- 4. Motor de Bloqueio (Pré-requisitos e DAG)
create table if not exists academy_prerequisites (
  id uuid default uuid_generate_v4() primary key,
  step_id uuid references academy_steps(id) on delete cascade not null,
  prerequisite_step_id uuid references academy_steps(id) on delete cascade not null,
  rule prerequisite_rule default 'completed' not null,
  parameters jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (step_id != prerequisite_step_id) -- Impede self-reference direto
);

create table if not exists academy_milestones (
  id uuid default uuid_generate_v4() primary key,
  path_id uuid references academy_paths(id) on delete cascade,
  phase_id uuid references academy_phases(id) on delete cascade,
  step_id uuid references academy_steps(id) on delete cascade,
  title text not null,
  description text,
  reward_type text,
  threshold text,
  position integer not null default 0,
  status academy_path_status default 'published' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 5. Progresso (Enrollments)
create table if not exists user_academy_enrollments (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  path_id uuid references academy_paths(id) on delete cascade not null,
  path_version integer not null, -- Garante integridade se o Admin criar V2.
  status text default 'active' not null, -- 'active', 'completed', 'dropped'
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(profile_id, path_id, path_version)
);

create table if not exists user_academy_progress (
  id uuid default uuid_generate_v4() primary key,
  enrollment_id uuid references user_academy_enrollments(id) on delete cascade not null,
  step_id uuid references academy_steps(id) on delete cascade not null,
  status text default 'locked' not null, -- 'locked', 'unlocked', 'completed'
  score integer,
  completed_at timestamp with time zone,
  unique(enrollment_id, step_id)
);


-- 6. Evolução dos Certificados (Polimorfismo e Revogação)
create table if not exists certificate_templates (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  version integer default 1 not null,
  background_asset_id uuid references media_assets(id) on delete restrict,
  layout_config jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_certificate_templates_modtime on certificate_templates;
create trigger update_certificate_templates_modtime before update on certificate_templates for each row execute procedure update_modified_column();

-- Alter existing certificates table to support Academy Paths and Cases, plus Revocation
-- Assuming certificates already has: profile_id, course_id, validation_code, issued_at
alter table certificates drop constraint if exists certificates_course_id_fkey;
alter table certificates alter column course_id drop not null;
alter table certificates add column if not exists case_id uuid references cases(id) on delete cascade;
alter table certificates add column if not exists path_id uuid references academy_paths(id) on delete cascade;
alter table certificates add column if not exists template_id uuid references certificate_templates(id) on delete set null;
alter table certificates add column if not exists status certificate_status default 'issued' not null;
alter table certificates add column if not exists revoked_at timestamp with time zone;
alter table certificates add column if not exists revoked_by uuid references auth.users(id) on delete set null;
alter table certificates add column if not exists revoked_reason text;
alter table certificates add column if not exists file_hash text;
-- Relax the unique constraint if it was strictly (profile_id, course_id)
alter table certificates drop constraint if exists certificates_profile_id_course_id_key;
-- Create new partial unique indexes to prevent multiple active certs per type
create unique index if not exists certs_profile_course_idx on certificates(profile_id, course_id) where status = 'issued' and course_id is not null;
create unique index if not exists certs_profile_case_idx on certificates(profile_id, case_id) where status = 'issued' and case_id is not null;
create unique index if not exists certs_profile_path_idx on certificates(profile_id, path_id) where status = 'issued' and path_id is not null;


-- 7. RLS Enforcement
alter table academy_paths enable row level security;
alter table academy_phases enable row level security;
alter table academy_steps enable row level security;
alter table academy_prerequisites enable row level security;
alter table user_academy_enrollments enable row level security;
alter table user_academy_progress enable row level security;
alter table certificate_templates enable row level security;

-- Reading policies for Published Paths
create policy "Users can read published academy paths" on academy_paths for select using (status = 'published');
create policy "Users can read phases of published paths" on academy_phases for select using (
  exists (select 1 from academy_paths where id = academy_phases.path_id and status = 'published')
);
create policy "Users can read steps of published phases" on academy_steps for select using (
  exists (select 1 from academy_phases join academy_paths on academy_paths.id = academy_phases.path_id where academy_phases.id = academy_steps.phase_id and academy_paths.status = 'published')
);
create policy "Users can read prerequisites of published steps" on academy_prerequisites for select using (
  exists (select 1 from academy_steps join academy_phases on academy_phases.id = academy_steps.phase_id join academy_paths on academy_paths.id = academy_phases.path_id where academy_steps.id = academy_prerequisites.step_id and academy_paths.status = 'published')
);

create policy "Users can view own enrollments" on user_academy_enrollments for select using (auth.uid() = profile_id);
create policy "Users can view own progress" on user_academy_progress for select using (
  exists (select 1 from user_academy_enrollments where id = user_academy_progress.enrollment_id and profile_id = auth.uid())
);

-- Admin Policies
create policy "Admins can manage academy_paths" on academy_paths for all using (has_permission('academy.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage academy_phases" on academy_phases for all using (has_permission('academy.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage academy_steps" on academy_steps for all using (has_permission('academy.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage academy_prerequisites" on academy_prerequisites for all using (has_permission('academy.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage certificates" on certificates for all using (has_permission('academy.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage templates" on certificate_templates for all using (has_permission('academy.manage') and (auth.jwt()->>'aal' = 'aal2'));

