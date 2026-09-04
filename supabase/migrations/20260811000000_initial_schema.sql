-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'admin', 'content_manager', 'support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ 
BEGIN
    CREATE TYPE profession_type AS ENUM ('veterinarian', 'student', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ 
BEGIN
    CREATE TYPE product_type AS ENUM ('course', 'subscription', 'bundle', 'event');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ 
BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft', 'upcoming');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ 
BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ 
BEGIN
    CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  display_name text,
  email text not null,
  avatar_url text,
  phone text,
  profession profession_type default 'veterinarian',
  crmv text,
  crmv_state text,
  birth_date date,
  bio text,
  role user_role default 'member' not null,
  communication_preferences jsonb default '{"email_notifications": true}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  type product_type not null,
  status product_status default 'draft' not null,
  is_free boolean default false not null,
  featured boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product Prices
create table if not exists product_prices (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products on delete cascade not null,
  currency text default 'BRL' not null,
  amount integer not null, -- in cents
  interval text, -- e.g., 'month', 'year' (null for one-time purchases)
  active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Purchases
create table if not exists purchases (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  product_id uuid references products on delete restrict not null,
  price_id uuid references product_prices on delete restrict not null,
  status purchase_status default 'pending' not null,
  payment_method text,
  amount_paid integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  product_id uuid references products on delete restrict not null,
  price_id uuid references product_prices on delete restrict not null,
  status subscription_status not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Entitlements (Source of truth for access)
create table if not exists entitlements (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  product_id uuid references products on delete cascade not null,
  source_type text not null, -- 'purchase', 'subscription', 'manual'
  source_id uuid, -- Reference to purchase_id or subscription_id
  expires_at timestamp with time zone, -- null means lifetime access
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courses
create table if not exists courses (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  instructor_id uuid references profiles,
  is_published boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Course Modules
create table if not exists course_modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses on delete cascade not null,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons
create table if not exists lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references course_modules on delete cascade not null,
  title text not null,
  description text,
  video_url text,
  duration_seconds integer,
  order_index integer not null default 0,
  is_published boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lesson Materials
create table if not exists lesson_materials (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references lessons on delete cascade not null,
  title text not null,
  file_url text not null,
  type text not null, -- 'pdf', 'link', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lesson Progress
create table if not exists lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  lesson_id uuid references lessons on delete cascade not null,
  is_completed boolean default false not null,
  last_position_seconds integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, lesson_id)
);

-- Stories (Casos da Semana)
create table if not exists story_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists story_groups (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  thumbnail_url text,
  category_id uuid references story_categories on delete set null,
  is_published boolean default false not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists story_items (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references story_groups on delete cascade not null,
  media_url text not null,
  media_type text not null, -- 'image', 'video'
  duration_seconds integer default 15,
  caption text,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists story_views (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  story_item_id uuid references story_items on delete cascade not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, story_item_id)
);

-- Notifications
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  type text not null,
  target_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists notification_reads (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  notification_id uuid references notifications on delete cascade not null,
  read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, notification_id)
);

-- Webhook Events (for idempotency)
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

-- Audit Logs
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  actor_id uuid references profiles on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) setup
alter table profiles enable row level security;
alter table products enable row level security;
alter table purchases enable row level security;
alter table subscriptions enable row level security;
alter table entitlements enable row level security;
alter table lesson_progress enable row level security;

-- Profile Policies
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Product Policies
create policy "Products are viewable by everyone." on products for select using (true);
-- Admin can manage products (we would need a function to check role, for now just basic auth)

-- Lesson Progress Policies
create policy "Users can view own progress." on lesson_progress for select using (auth.uid() = profile_id);
create policy "Users can insert own progress." on lesson_progress for insert with check (auth.uid() = profile_id);
create policy "Users can update own progress." on lesson_progress for update using (auth.uid() = profile_id);

-- Entitlements Policies
create policy "Users can view own entitlements." on entitlements for select using (auth.uid() = profile_id);

-- Trigger for updating timestamps
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_profiles_modtime before update on profiles for each row execute procedure update_modified_column();
create trigger update_products_modtime before update on products for each row execute procedure update_modified_column();
create trigger update_courses_modtime before update on courses for each row execute procedure update_modified_column();
create trigger update_lessons_modtime before update on lessons for each row execute procedure update_modified_column();
