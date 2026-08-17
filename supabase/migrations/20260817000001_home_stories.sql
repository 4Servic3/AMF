-- Migration: Stage 6 - Gestão da Home, Banners, Stories e Close Friends

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE home_section_status AS ENUM ('draft', 'review', 'scheduled', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE story_status AS ENUM ('draft', 'review', 'scheduled', 'published', 'expired', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cta_target_type AS ENUM ('course', 'case', 'lesson', 'subscription_checkout', 'external_url');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visibility_type AS ENUM ('free', 'authenticated', 'premium', 'entitlement');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- 2. Home Sections
create table if not exists home_sections (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  title text not null,
  section_type text not null, -- 'hero', 'carousel', 'shortcuts'
  position integer not null default 0,
  status home_section_status default 'draft' not null,
  visibility visibility_type default 'free' not null,
  targeting_rules jsonb default '{}'::jsonb not null,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer default 1 not null, -- optimistic locking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Triggers for updated_at and version
drop trigger if exists update_home_sections_modtime on home_sections;
create trigger update_home_sections_modtime before update on home_sections for each row execute procedure update_modified_column();

create or replace function public.increment_version()
returns trigger as $$
begin
    new.version = old.version + 1;
    return new;
end;
$$ language plpgsql;

drop trigger if exists increment_home_sections_version on home_sections;
create trigger increment_home_sections_version before update on home_sections for each row execute procedure increment_version();

-- 3. Home Banners
create table if not exists home_banners (
  id uuid default uuid_generate_v4() primary key,
  section_id uuid references home_sections on delete cascade not null,
  media_asset_id uuid references media_assets on delete restrict,
  eyebrow text,
  title text,
  subtitle text,
  cta_label text,
  cta_target_type cta_target_type,
  cta_target_id text, -- ID of course/case or external URL
  mobile_focal_point text default 'center' not null,
  desktop_focal_point text default 'center' not null,
  position integer not null default 0,
  status home_section_status default 'draft' not null,
  segmentation jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists update_home_banners_modtime on home_banners;
create trigger update_home_banners_modtime before update on home_banners for each row execute procedure update_modified_column();


-- 4. Stories Adaptation
-- Rename story tables securely
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_groups') THEN
    ALTER TABLE story_groups RENAME TO story_collections;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_items') THEN
    ALTER TABLE story_items RENAME TO stories;
  END IF;
END $$;

-- Update story_collections
alter table story_collections add column if not exists cover_asset_id uuid references media_assets(id) on delete restrict;
alter table story_collections add column if not exists color_token text;
alter table story_collections add column if not exists position integer default 0 not null;
-- Need to cast existing status to our logic, but to avoid type conflicts if it was text, we'll just add new columns for the specific Enums if needed, or keep it text.
-- Since they were text in migration 4, we will keep them as text to avoid casting errors with existing data, but we'll add constraints.
alter table story_collections drop constraint if exists story_collections_visibility_check;
alter table story_collections add column if not exists visibility visibility_type default 'free' not null;
alter table story_collections add column if not exists starts_at timestamp with time zone;
alter table story_collections add column if not exists version integer default 1 not null;

drop trigger if exists increment_story_collections_version on story_collections;
create trigger increment_story_collections_version before update on story_collections for each row execute procedure increment_version();

-- Update stories
-- group_id becomes collection_id
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'group_id') THEN
    ALTER TABLE stories RENAME COLUMN group_id TO collection_id;
  END IF;
END $$;

alter table stories add column if not exists media_asset_id uuid references media_assets(id) on delete restrict;
alter table stories add column if not exists position integer default 0 not null;
alter table stories add column if not exists starts_at timestamp with time zone;
alter table stories add column if not exists expires_at timestamp with time zone;
alter table stories add column if not exists keep_in_archive boolean default true not null;
alter table stories add column if not exists cta_target_type cta_target_type;
alter table stories add column if not exists version integer default 1 not null;

drop trigger if exists increment_stories_version on stories;
create trigger increment_stories_version before update on stories for each row execute procedure increment_version();

-- We don't touch story_views as requested (keeps progress/metrics isolated)

-- 5. RLS Policies
alter table home_sections enable row level security;
alter table home_banners enable row level security;
alter table story_collections enable row level security;
alter table stories enable row level security;

-- Only admins with specific permissions can edit.
-- Read access for 'published' content logic:
create policy "Published home sections visible to all" on home_sections for select using (status = 'published');
create policy "Manage home_sections for admins" on home_sections for all using (has_permission('content.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Published banners visible to all" on home_banners for select using (status = 'published');
create policy "Manage home_banners for admins" on home_banners for all using (has_permission('content.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Published collections visible to all" on story_collections for select using (status = 'published');
create policy "Manage collections for admins" on story_collections for all using (has_permission('content.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Published stories visible to all" on stories for select using (status = 'published');
create policy "Manage stories for admins" on stories for all using (has_permission('content.manage') and (auth.jwt()->>'aal' = 'aal2'));
