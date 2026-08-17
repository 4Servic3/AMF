-- Migration: Stage 7 - Gestão Completa de Casos Clínicos

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE case_status AS ENUM ('draft', 'in_review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_featured_type AS ENUM ('none', 'week', 'close_friends');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_question_type AS ENUM ('single', 'multiple', 'text', 'reflection');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_asset_role AS ENUM ('exam', 'image', 'document', 'video');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- 2. Core Case Entities
create table if not exists case_specialties (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  color_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists case_tags (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists cases (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  short_title text,
  summary text,
  specialty_id uuid references case_specialties(id) on delete set null,
  difficulty integer check (difficulty between 1 and 5),
  estimated_minutes integer default 15,
  cover_asset_id uuid references media_assets(id) on delete restrict,
  hero_asset_id uuid references media_assets(id) on delete restrict,
  status case_status default 'draft' not null,
  visibility visibility_type default 'free' not null,
  required_entitlement_id uuid references entitlements(id) on delete set null,
  featured_type case_featured_type default 'none' not null,
  author_id uuid references auth.users(id) on delete restrict not null,
  clinical_reviewer_id uuid references auth.users(id) on delete set null,
  version integer default 1 not null,
  published_at timestamp with time zone,
  archived_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_cases_modtime on cases;
create trigger update_cases_modtime before update on cases for each row execute procedure update_modified_column();

drop trigger if exists increment_cases_version on cases;
create trigger increment_cases_version before update on cases for each row execute procedure increment_version();

-- 3. Case Structure
create table if not exists case_chapters (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references cases(id) on delete cascade not null,
  position integer not null default 0,
  title text not null,
  clinical_stage text, -- e.g., 'Anamnese', 'Exame Físico', 'Evolução'
  body jsonb not null default '{}'::jsonb, -- Structured Rich Text
  estimated_minutes integer default 5,
  visibility_rules jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_case_chapters_modtime on case_chapters;
create trigger update_case_chapters_modtime before update on case_chapters for each row execute procedure update_modified_column();

create table if not exists case_assets (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references cases(id) on delete cascade not null,
  chapter_id uuid references case_chapters(id) on delete cascade,
  asset_id uuid references media_assets(id) on delete restrict not null,
  role case_asset_role default 'image' not null,
  caption text,
  alt_text text,
  position integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Case Questions & Options
create table if not exists case_questions (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references cases(id) on delete cascade not null,
  chapter_id uuid references case_chapters(id) on delete cascade,
  question_type case_question_type default 'single' not null,
  prompt text not null,
  explanation text, -- Shown only after answer
  points integer default 10 not null,
  position integer not null default 0,
  is_required boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_case_questions_modtime on case_questions;
create trigger update_case_questions_modtime before update on case_questions for each row execute procedure update_modified_column();

create table if not exists case_options (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references case_questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean not null default false, -- SECURE: Filtered out on client selects
  position integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Progress Tracking (Students)
create table if not exists case_progress (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  case_id uuid references cases(id) on delete cascade not null,
  status text default 'started' not null, -- 'started', 'completed'
  score integer default 0,
  certificate_issued boolean default false,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(profile_id, case_id)
);

create table if not exists case_attempts (
  id uuid default uuid_generate_v4() primary key,
  progress_id uuid references case_progress(id) on delete cascade not null,
  attempt_number integer not null default 1,
  case_version integer not null, -- Snapshot of the case version they took
  score integer default 0,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

create table if not exists case_answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references case_attempts(id) on delete cascade not null,
  question_id uuid references case_questions(id) on delete cascade not null,
  selected_option_id uuid references case_options(id) on delete cascade,
  text_answer text,
  is_correct boolean,
  points_awarded integer default 0,
  answered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(attempt_id, question_id)
);

-- --- ROW LEVEL SECURITY (RLS) ---
alter table cases enable row level security;
alter table case_chapters enable row level security;
alter table case_questions enable row level security;
alter table case_options enable row level security;

-- Public/Student Reading Logic
create policy "Published cases are visible to everyone" on cases for select using (status = 'published');
create policy "Chapters of published cases are visible" on case_chapters for select using (
  exists (select 1 from cases where id = case_chapters.case_id and status = 'published')
);
create policy "Questions of published cases are visible" on case_questions for select using (
  exists (select 1 from cases where id = case_questions.case_id and status = 'published')
);
-- Important: `case_options` does NOT expose `is_correct` natively if queried by anon/authenticated.
-- To enforce this securely via PostgREST, we typically omit the column in the client query or use a restricted view.
create policy "Options of published cases are visible" on case_options for select using (
  exists (select 1 from case_questions q join cases c on c.id = q.case_id where q.id = case_options.question_id and c.status = 'published')
);

-- Admin Management (Four-Eyes Principle encoded here or in DAL. For RLS, we require cases.manage)
create policy "Admins can manage cases" on cases for all using (has_permission('cases.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage chapters" on case_chapters for all using (has_permission('cases.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage questions" on case_questions for all using (has_permission('cases.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage options" on case_options for all using (has_permission('cases.manage') and (auth.jwt()->>'aal' = 'aal2'));

-- Four-Eyes Constraint logic is complex for standard RLS, better enforced via Application/DAL layer or triggers.
-- Here we add a database trigger as an absolute safety net against self-approval.
create or replace function prevent_self_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status != 'approved' then
    if new.author_id = new.clinical_reviewer_id then
      raise exception 'FOUR_EYES_VIOLATION: The author cannot be the clinical reviewer.';
    end if;
    if auth.uid() = new.author_id then
      raise exception 'FOUR_EYES_VIOLATION: The author cannot approve their own case.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_four_eyes on cases;
create trigger enforce_four_eyes before update on cases for each row execute procedure prevent_self_approval();

