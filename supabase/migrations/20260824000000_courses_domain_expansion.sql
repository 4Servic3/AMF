-- Migration: Courses Domain Expansion
-- Aditive migration to extend the existing schema to meet the new domain requirements.

-- 1. COURSES
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug text unique;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_asset_id uuid references media_assets(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS banner_asset_id uuid references media_assets(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS workload integer; -- in minutes
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status text default 'draft' check (status in ('draft', 'in_review', 'published', 'archived'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS visibility text default 'private' check (visibility in ('public', 'private', 'unlisted'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_rule jsonb default '{}'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS version integer default 1;

-- Soft delete / archive logic for courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- 2. COURSE MODULES
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS status text default 'draft' check (status in ('draft', 'published', 'archived'));
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS release_rule jsonb default '{}'::jsonb;

-- Add unique constraint for positions per course, deferrable in case of reordering
ALTER TABLE course_modules ADD CONSTRAINT uq_course_module_position UNIQUE (course_id, order_index) DEFERRABLE INITIALLY DEFERRED;

-- 3. LESSONS
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type text default 'video' check (type in ('video', 'external_link', 'pdf_material'));
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_mandatory boolean default true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS status text default 'draft' check (status in ('draft', 'published', 'archived'));
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS completion_rule jsonb default '{}'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS release_at timestamp with time zone;
-- specific typed columns instead of json
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS external_resource_id uuid; -- will be defined below
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_asset_id uuid; -- will be defined below

-- Add unique constraint for positions per module
ALTER TABLE lessons ADD CONSTRAINT uq_lesson_position UNIQUE (module_id, order_index) DEFERRABLE INITIALLY DEFERRED;

-- 4. VIDEO ASSET METADATA
CREATE TABLE IF NOT EXISTS video_assets (
  id uuid default uuid_generate_v4() primary key,
  provider text not null,
  provider_asset_id text not null,
  playback_id text,
  playback_policy text default 'public',
  status text not null default 'uploading' check (status in ('uploading', 'processing', 'ready', 'error')),
  duration_seconds integer,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE lessons ADD CONSTRAINT fk_lesson_video FOREIGN KEY (video_asset_id) REFERENCES video_assets(id) ON DELETE SET NULL;

-- 5. EXTERNAL RESOURCE
CREATE TABLE IF NOT EXISTS external_resources (
  id uuid default uuid_generate_v4() primary key,
  allowed_hostname text not null,
  label text not null,
  status text default 'active' check (status in ('active', 'inactive')),
  private_destination_url text not null, -- never exposed to client directly
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE lessons ADD CONSTRAINT fk_lesson_external FOREIGN KEY (external_resource_id) REFERENCES external_resources(id) ON DELETE SET NULL;

-- 6. MATERIAL
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS course_id uuid references courses(id) on delete cascade;
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS size_bytes bigint;
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS checksum text;
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS view_policy text default 'private';
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS download_policy text default 'allowed';
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS bucket_name text default 'materials';
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS status text default 'published' check (status in ('draft', 'published', 'archived'));

-- 7. ENROLLMENT/ENTITLEMENT
-- entitlements already exists. We add audit/status fields
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS status text default 'active' check (status in ('active', 'expired', 'revoked'));
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS starts_at timestamp with time zone default timezone('utc'::text, now());
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS origin text;

-- 8. PROGRESS
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS course_id uuid references courses(id) on delete cascade;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS module_id uuid references course_modules(id) on delete cascade;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS progress_percent numeric(5,2) default 0.00;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed'));
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS first_started_at timestamp with time zone;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Idempotency is already covered by the unique constraint on (profile_id, lesson_id).

-- RLS & Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Anonymous: no premium content, can't read internal things
-- Member without entitlement: only public metadata of courses
-- Member eligible: can see modules, lessons, materials of courses they are entitled to.
-- Members can see their own progress.

-- Admin Policies setup
-- Superadmin AAL2: full access
-- Revisor/publish: manage permissions

-- Helper Function for Course Access
CREATE OR REPLACE FUNCTION has_course_access(course_uuid uuid) RETURNS boolean AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM entitlements 
    WHERE profile_id = auth.uid() 
      AND resource_id = course_uuid 
      AND resource_type = 'course'
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND starts_at <= now()
  ) INTO has_access;
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke execute from public to be safe, grant to authenticated
REVOKE EXECUTE ON FUNCTION has_course_access FROM PUBLIC;
GRANT EXECUTE ON FUNCTION has_course_access TO authenticated;

-- Courses: 
-- 1. Public catalog (only published courses)
CREATE POLICY "Public catalog viewable by anyone" ON courses FOR SELECT USING (status = 'published');
-- 2. Admins full access
CREATE POLICY "Admins manage courses" ON courses FOR ALL USING (has_permission('content.manage') AND auth.jwt()->>'aal' = 'aal2');

-- Course Modules:
-- 1. Members can see published modules of courses they have access to, or public courses?
-- The prompt says "membro autenticado sem entitlement: apenas metadados públicos do catálogo"
-- So modules are only visible if you have entitlement OR if they are public preview? Let's just say only if entitled.
CREATE POLICY "Members see modules of enrolled courses" ON course_modules FOR SELECT USING (
  status = 'published' AND has_course_access(course_id)
);
CREATE POLICY "Admins manage course modules" ON course_modules FOR ALL USING (has_permission('content.manage') AND auth.jwt()->>'aal' = 'aal2');

-- Lessons:
CREATE POLICY "Members see lessons of enrolled modules" ON lessons FOR SELECT USING (
  status = 'published' AND EXISTS (
    SELECT 1 FROM course_modules WHERE course_modules.id = lessons.module_id AND has_course_access(course_modules.course_id)
  )
);
CREATE POLICY "Admins manage lessons" ON lessons FOR ALL USING (has_permission('content.manage') AND auth.jwt()->>'aal' = 'aal2');

-- Lesson Materials:
CREATE POLICY "Members see materials of enrolled lessons" ON lesson_materials FOR SELECT USING (
  status = 'published' AND has_course_access(course_id)
);
CREATE POLICY "Admins manage materials" ON lesson_materials FOR ALL USING (has_permission('content.manage') AND auth.jwt()->>'aal' = 'aal2');

-- Lesson Progress:
-- Users can manage their own progress
CREATE POLICY "Users view own progress" ON lesson_progress FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users update own progress" ON lesson_progress FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Admins view all progress" ON lesson_progress FOR SELECT USING (has_permission('users.view') AND auth.jwt()->>'aal' = 'aal2');

-- Video Assets & External Resources: only admins or internal server operations
-- External resources URL never readable by client, so we do NOT create a public select policy.
CREATE POLICY "Admins manage video assets" ON video_assets FOR ALL USING (has_permission('content.manage') AND auth.jwt()->>'aal' = 'aal2');
CREATE POLICY "Admins manage external resources" ON external_resources FOR ALL USING (has_permission('content.manage') AND auth.jwt()->>'aal' = 'aal2');

-- Seed "Imersão Clínica Felina - Parte 1" if it doesn't exist
DO $$
DECLARE
  v_course_id uuid;
  v_module1_id uuid;
  v_module2_id uuid;
  v_module3_id uuid;
  v_lesson1_id uuid;
  v_lesson2_id uuid;
  v_ext_res_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM courses WHERE slug = 'imersao-clinica-felina-p1') THEN
    -- Course
    INSERT INTO courses (title, slug, status, visibility)
    VALUES ('Imersão Clínica Felina — Parte 1', 'imersao-clinica-felina-p1', 'draft', 'private')
    RETURNING id INTO v_course_id;

    -- Module 1
    INSERT INTO course_modules (course_id, title, order_index, status)
    VALUES (v_course_id, 'Módulo 1 — Aulas da imersão', 1, 'draft')
    RETURNING id INTO v_module1_id;

    -- Lessons Mod 1
    INSERT INTO lessons (module_id, title, type, order_index, status)
    VALUES 
      (v_module1_id, 'Aula 1', 'video', 1, 'draft'),
      (v_module1_id, 'Aula 2', 'video', 2, 'draft');

    -- Module 2
    INSERT INTO course_modules (course_id, title, order_index, status)
    VALUES (v_course_id, 'Módulo 2 — Comunidade da turma', 2, 'draft')
    RETURNING id INTO v_module2_id;

    -- External Resource
    INSERT INTO external_resources (allowed_hostname, label, private_destination_url)
    VALUES ('whatsapp.com', 'WhatsApp Group', 'https://chat.whatsapp.com/invitation_link_internal')
    RETURNING id INTO v_ext_res_id;

    -- Lesson Mod 2
    INSERT INTO lessons (module_id, title, type, external_resource_id, order_index, status)
    VALUES (v_module2_id, 'Entrar no grupo de médicos-veterinários', 'external_link', v_ext_res_id, 1, 'draft');

    -- Module 3
    INSERT INTO course_modules (course_id, title, order_index, status)
    VALUES (v_course_id, 'Módulo 3 — Materiais dos casos', 3, 'draft')
    RETURNING id INTO v_module3_id;

  END IF;
END $$;
