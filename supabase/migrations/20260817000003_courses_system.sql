-- Migration: Stage 8 - Cursos, Módulos, Aulas, Avaliações e Banco Global de Questões

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE course_type AS ENUM ('course', 'subscription', 'package');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE unlock_rule_type AS ENUM ('sequential', 'date', 'manual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE download_policy_type AS ENUM ('view', 'download', 'disabled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE completion_rule_type AS ENUM ('button_click', 'video_end', 'quiz_passed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Adaptar Tabelas de Cursos Existentes
alter table courses add column if not exists banner_asset_id uuid references media_assets(id) on delete set null;
alter table courses add column if not exists course_type course_type default 'course' not null;
alter table courses add column if not exists visibility visibility_type default 'free' not null;
alter table courses add column if not exists required_entitlement_id uuid references entitlements(id) on delete set null;
alter table courses add column if not exists certificate_rule_id text;
alter table courses add column if not exists version integer default 1 not null;

-- Use existing update_modified_column trigger if missing, or recreate safely
drop trigger if exists update_courses_modtime on courses;
create trigger update_courses_modtime before update on courses for each row execute procedure update_modified_column();

drop trigger if exists increment_courses_version on courses;
create trigger increment_courses_version before update on courses for each row execute procedure increment_version();


-- 3. Course Modules Updates
-- Assuming course_modules already exists. We add what is missing.
alter table course_modules add column if not exists unlock_rule unlock_rule_type default 'manual' not null;
alter table course_modules add column if not exists version integer default 1 not null;

drop trigger if exists increment_course_modules_version on course_modules;
create trigger increment_course_modules_version before update on course_modules for each row execute procedure increment_version();


-- 4. Lessons Updates
alter table lessons add column if not exists primary_media_asset_id uuid references media_assets(id) on delete set null;
alter table lessons add column if not exists body jsonb default '{}'::jsonb not null;
alter table lessons add column if not exists completion_rule completion_rule_type default 'button_click' not null;
alter table lessons add column if not exists version integer default 1 not null;

drop trigger if exists update_lessons_modtime on lessons;
create trigger update_lessons_modtime before update on lessons for each row execute procedure update_modified_column();

drop trigger if exists increment_lessons_version on lessons;
create trigger increment_lessons_version before update on lessons for each row execute procedure increment_version();


-- 5. Lesson Materials Updates
alter table lesson_materials add column if not exists media_asset_id uuid references media_assets(id) on delete cascade;
alter table lesson_materials add column if not exists download_policy download_policy_type default 'view' not null;


-- 6. GLOBAL QUESTION BANK
create table if not exists global_questions (
  id uuid default uuid_generate_v4() primary key,
  prompt text not null,
  explanation text,
  question_type case_question_type default 'single' not null,
  difficulty question_difficulty default 'medium' not null,
  tags jsonb default '[]'::jsonb not null,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_global_questions_modtime on global_questions;
create trigger update_global_questions_modtime before update on global_questions for each row execute procedure update_modified_column();

create table if not exists global_options (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references global_questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean not null default false, -- SECURE: Hidden from clients unless answered
  position integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 7. Quizzes (Assessment instances attached to Lessons)
create table if not exists quizzes (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null unique,
  min_passing_score integer default 70 not null,
  max_attempts integer, -- null means unlimited
  shuffle_questions boolean default true not null,
  validity_days integer, -- expiration of attempt
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- M2M Mapping: Quiz -> Global Questions
create table if not exists quiz_questions (
  quiz_id uuid references quizzes(id) on delete cascade not null,
  question_id uuid references global_questions(id) on delete cascade not null,
  points integer default 10 not null,
  position integer not null default 0,
  primary key(quiz_id, question_id)
);

create table if not exists quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  attempt_number integer not null default 1,
  score integer,
  passed boolean,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(profile_id, quiz_id, attempt_number)
);

create table if not exists quiz_answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references quiz_attempts(id) on delete cascade not null,
  question_id uuid references global_questions(id) on delete cascade not null,
  selected_option_id uuid references global_options(id) on delete cascade,
  text_answer text,
  is_correct boolean,
  points_awarded integer default 0,
  answered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(attempt_id, question_id)
);

-- RLS Enforcement
alter table global_questions enable row level security;
alter table global_options enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_answers enable row level security;

-- Reading policy for published courses' quizzes
create policy "Users can read quizzes of published lessons" on quizzes for select using (
  exists (select 1 from lessons join course_modules on lessons.module_id = course_modules.id join courses on course_modules.course_id = courses.id where lessons.id = quizzes.lesson_id and courses.status = 'published')
);

create policy "Users can read questions of active quizzes" on global_questions for select using (
  exists (select 1 from quiz_questions qq join quizzes q on q.id = qq.quiz_id join lessons l on l.id = q.lesson_id join course_modules m on m.id = l.module_id join courses c on c.id = m.course_id where qq.question_id = global_questions.id and c.status = 'published')
);

create policy "Users can read options of active quizzes" on global_options for select using (
  exists (select 1 from global_questions gq join quiz_questions qq on qq.question_id = gq.id join quizzes q on q.id = qq.quiz_id join lessons l on l.id = q.lesson_id join course_modules m on m.id = l.module_id join courses c on c.id = m.course_id where gq.id = global_options.question_id and c.status = 'published')
);

create policy "Admins can manage global_questions" on global_questions for all using (has_permission('courses.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage global_options" on global_options for all using (has_permission('courses.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage quizzes" on quizzes for all using (has_permission('courses.manage') and (auth.jwt()->>'aal' = 'aal2'));
create policy "Admins can manage quiz_questions" on quiz_questions for all using (has_permission('courses.manage') and (auth.jwt()->>'aal' = 'aal2'));
