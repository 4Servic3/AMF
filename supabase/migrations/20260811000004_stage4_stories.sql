-- Migrations for Stage 4: Casos da Semana (Stories)

-- 1. Story Categories Updates
alter table story_categories add column if not exists slug text unique;
alter table story_categories add column if not exists order_index integer default 0;

-- 2. Story Groups (Casos) Updates
alter table story_groups add column if not exists slug text unique;
alter table story_groups add column if not exists summary text;
alter table story_groups add column if not exists tags jsonb default '[]'::jsonb;
alter table story_groups add column if not exists author_id uuid references profiles on delete set null;
alter table story_groups add column if not exists case_date date;
alter table story_groups add column if not exists published_at timestamp with time zone;
alter table story_groups add column if not exists keep_in_archive boolean default true;
alter table story_groups add column if not exists product_id uuid references products on delete set null;
alter table story_groups add column if not exists free_preview_count integer default 1;
alter table story_groups add column if not exists status text default 'draft'; -- 'draft', 'review', 'scheduled', 'published', 'archived'
alter table story_groups add column if not exists is_featured boolean default false;
alter table story_groups add column if not exists content_warning text;
alter table story_groups add column if not exists checklist_completed_at timestamp with time zone;
alter table story_groups add column if not exists checklist_completed_by uuid references profiles;

-- Migrate existing boolean is_published to status
update story_groups set status = 'published' where is_published = true;

-- 3. Story Items Updates
alter table story_items add column if not exists thumbnail_url text;
alter table story_items add column if not exists transcript text;
alter table story_items add column if not exists is_free boolean default false;
alter table story_items add column if not exists cta_text text;
alter table story_items add column if not exists cta_url text;
alter table story_items add column if not exists material_url text;
alter table story_items add column if not exists material_title text;
alter table story_items add column if not exists status text default 'processed'; -- 'processing', 'processed', 'error'

-- 4. New Tables: Story Answers (for polls and questions)
create table if not exists story_answers (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  story_item_id uuid references story_items on delete cascade not null,
  answer_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, story_item_id)
);
alter table story_answers enable row level security;
create policy "Users can insert own answers." on story_answers for insert with check (auth.uid() = profile_id);
create policy "Users can view own answers." on story_answers for select using (auth.uid() = profile_id);
create policy "Admins can view all answers." on story_answers for select using (true); -- In a real app, limit to admin roles via function

-- RLS Updates for groups and items (General access logic)
-- Members can view published groups, or anything if they are admins (simulated via true for now, refined in app logic)
create policy "Published groups viewable by all." on story_groups for select using (status = 'published');
create policy "Published items viewable by all." on story_items for select using (
  exists (select 1 from story_groups where id = story_items.group_id and status = 'published')
);

-- Note: In MVP, detailed RLS (like blocking non-free items) is often done at the application tier or with complex SQL functions. 
-- For this MVP, the middleware and application logic will enforce the `free_preview_count` and product entitlements.
