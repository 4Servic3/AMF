-- Migration: Stage 5 - Biblioteca de Mídias e Armazenamento Privado

-- Helper function for updated_at (should already exist, but safe to redefine)
create or replace function public.update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_status AS ENUM ('uploading', 'processing', 'ready', 'failed', 'quarantined', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_visibility AS ENUM ('public', 'authenticated', 'premium', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Media Assets Table
create table if not exists media_assets (
  id uuid default uuid_generate_v4() primary key,
  bucket text not null,
  object_path text not null,
  storage_provider text default 'supabase' not null,
  original_filename text not null,
  display_name text not null,
  media_type media_type not null,
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  duration_seconds integer,
  checksum_sha256 text,
  status media_status default 'uploading' not null,
  visibility media_visibility default 'admin' not null,
  title text,
  caption text,
  alt_text text,
  description text,
  created_by uuid references auth.users on delete set null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  archived_at timestamp with time zone,
  unique(bucket, object_path)
);

-- 3. Media Tags and Taxonomies
create table if not exists media_tags (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists media_asset_tags (
  asset_id uuid references media_assets on delete cascade not null,
  tag_id uuid references media_tags on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (asset_id, tag_id)
);

-- 4. Media Usage Tracking
create table if not exists media_usage (
  id uuid default uuid_generate_v4() primary key,
  asset_id uuid references media_assets on delete restrict not null, -- RESTRICT prevents deletion if used
  entity_type text not null, -- e.g., 'course', 'story', 'profile'
  entity_id uuid not null,
  field_name text not null,  -- e.g., 'thumbnail_url', 'avatar_url'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(asset_id, entity_type, entity_id, field_name)
);

-- 5. Media Processing Jobs (Queue for thumbnails, transcoding)
create table if not exists media_processing_jobs (
  id uuid default uuid_generate_v4() primary key,
  asset_id uuid references media_assets on delete cascade not null,
  operation text not null, -- e.g., 'generate_thumbnail', 'transcode_video'
  status text default 'pending' not null,
  attempts integer default 0 not null,
  last_error text,
  idempotency_key text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_media_assets_status on media_assets(status);
create index if not exists idx_media_assets_visibility on media_assets(visibility);
create index if not exists idx_media_usage_entity on media_usage(entity_type, entity_id);

-- Triggers for updated_at
drop trigger if exists update_media_assets_modtime on media_assets;
create trigger update_media_assets_modtime before update on media_assets for each row execute procedure update_modified_column();

drop trigger if exists update_media_jobs_modtime on media_processing_jobs;
create trigger update_media_jobs_modtime before update on media_processing_jobs for each row execute procedure update_modified_column();

-- --- ROW LEVEL SECURITY (RLS) FOR TABLES ---
alter table media_assets enable row level security;
alter table media_tags enable row level security;
alter table media_asset_tags enable row level security;
alter table media_usage enable row level security;
alter table media_processing_jobs enable row level security;

-- Table Policies: Admin Read/Write with AAL2 and media.manage
create policy "Read media_assets if dashboard.read" on media_assets for select using (has_permission('dashboard.read'));
create policy "Manage media_assets with media.manage and AAL2" on media_assets for all 
  using (has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Read media_tags if dashboard.read" on media_tags for select using (has_permission('dashboard.read'));
create policy "Manage media_tags with media.manage and AAL2" on media_tags for all 
  using (has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Read media_asset_tags if dashboard.read" on media_asset_tags for select using (has_permission('dashboard.read'));
create policy "Manage media_asset_tags with media.manage and AAL2" on media_asset_tags for all 
  using (has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Read media_usage if dashboard.read" on media_usage for select using (has_permission('dashboard.read'));
create policy "Manage media_usage with media.manage and AAL2" on media_usage for all 
  using (has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));


-- --- SUPABASE STORAGE BUCKETS ---
-- Ensure storage schema is accessible
create schema if not exists storage;

-- Create Buckets securely (Idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('public_media', 'public_media', true, 5242880, '{"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}'), -- 5MB limit
  ('premium_media', 'premium_media', false, 2147483648, '{"video/mp4", "video/webm", "application/pdf", "audio/mpeg", "audio/ogg"}'), -- 2GB limit
  ('admin_media', 'admin_media', false, 10485760, null) -- 10MB limit, internal use
on conflict (id) do update set 
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- --- STORAGE POLICIES ---

-- public_media: Read access for everyone
create policy "Public Access to public_media" on storage.objects for select
  using (bucket_id = 'public_media');

-- premium_media: Read access requires authenticated user and specific entitlement check
-- For now, basic auth is required. Real entitlement check should be via RLS joining entitlements table or signed URLs
create policy "Premium Access to premium_media" on storage.objects for select
  using (bucket_id = 'premium_media' and auth.role() = 'authenticated');

-- admin_media: Read access requires dashboard.read permission
create policy "Admin Access to admin_media" on storage.objects for select
  using (bucket_id = 'admin_media' and has_permission('dashboard.read'));

-- Upload Policies: Only Admins with media.manage and AAL2 can upload to any bucket
create policy "Admin Upload to public_media" on storage.objects for insert
  with check (bucket_id = 'public_media' and has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Admin Upload to premium_media" on storage.objects for insert
  with check (bucket_id = 'premium_media' and has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Admin Upload to admin_media" on storage.objects for insert
  with check (bucket_id = 'admin_media' and has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

-- Update and Delete Policies: Same requirement (media.manage + AAL2)
create policy "Admin Update Objects" on storage.objects for update
  using (has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

create policy "Admin Delete Objects" on storage.objects for delete
  using (has_permission('media.manage') and (auth.jwt()->>'aal' = 'aal2'));

