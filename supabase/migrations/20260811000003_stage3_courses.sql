-- Migrations for Stage 3: Courses, Modules, Lessons, Progress, Certificates

-- 1. Courses Table Updates
alter table courses add column if not exists slug text unique;
alter table courses add column if not exists cover_url text;
alter table courses add column if not exists trailer_url text;
alter table courses add column if not exists level text default 'intermediário';
alter table courses add column if not exists duration_hours integer default 0;
alter table courses add column if not exists status text default 'draft'; -- 'draft', 'published', 'archived'
alter table courses add column if not exists order_index integer default 0;
alter table courses add column if not exists published_at timestamp with time zone;
alter table courses add column if not exists certificate_enabled boolean default false;
alter table courses add column if not exists min_completion_percent integer default 90;
alter table courses add column if not exists content_version integer default 1;

-- Drop old boolean if we want to fully migrate, but better to keep it backwards compatible for now
-- alter table courses drop column is_published;

-- 2. Modules Table Updates
alter table course_modules add column if not exists status text default 'published';
alter table course_modules add column if not exists release_date timestamp with time zone;
alter table course_modules add column if not exists release_rule text default 'immediate'; -- 'immediate', 'date', 'days_after_access'
alter table course_modules add column if not exists release_days integer default 0;

-- 3. Lessons Table Updates
alter table lessons add column if not exists slug text unique;
alter table lessons add column if not exists type text default 'video'; -- 'video', 'text', 'audio', 'live', 'assessment'
alter table lessons add column if not exists video_id text;
alter table lessons add column if not exists thumbnail_url text;
alter table lessons add column if not exists has_captions boolean default false;
alter table lessons add column if not exists has_transcript boolean default false;
alter table lessons add column if not exists is_free_preview boolean default false;
alter table lessons add column if not exists release_date timestamp with time zone;
alter table lessons add column if not exists is_required boolean default true;
alter table lessons add column if not exists status text default 'draft';

-- 4. Materials Table Updates
alter table lesson_materials add column if not exists description text;
alter table lesson_materials add column if not exists size_bytes integer default 0;
alter table lesson_materials add column if not exists order_index integer default 0;
alter table lesson_materials add column if not exists access_rule text default 'public'; -- 'public', 'protected'

-- 5. User Progress Table Updates
alter table lesson_progress add column if not exists first_accessed_at timestamp with time zone default now();
alter table lesson_progress add column if not exists completed_at timestamp with time zone;
alter table lesson_progress add column if not exists completed_by text default 'auto'; -- 'auto', 'manual'
alter table lesson_progress add column if not exists total_watch_time integer default 0;

-- 6. New Tables

-- User Notes
create table if not exists user_notes (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  lesson_id uuid references lessons on delete cascade not null,
  content text not null,
  video_timestamp_seconds integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table user_notes enable row level security;
create policy "Users can manage own notes." on user_notes for all using (auth.uid() = profile_id);

-- User Favorites
create table if not exists user_favorites (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  entity_type text not null, -- 'lesson', 'material'
  entity_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, entity_type, entity_id)
);
alter table user_favorites enable row level security;
create policy "Users can manage own favorites." on user_favorites for all using (auth.uid() = profile_id);

-- Certificates
create table if not exists certificates (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  course_id uuid references courses on delete cascade not null,
  validation_code text unique not null,
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, course_id)
);
alter table certificates enable row level security;
create policy "Public can view valid certificates" on certificates for select using (true);
create policy "Users can view own certificates" on certificates for select using (auth.uid() = profile_id);
