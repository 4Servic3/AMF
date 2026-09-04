-- Migration: Mux Video Domain & RLS Hardening
-- Aditive migration to extend schema for Mux integration, lesson_videos relationship, and strict RLS.

-- 1. EXTEND VIDEO_ASSETS
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_upload_id text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_asset_id text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_playback_id text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS aspect_ratio text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS max_stored_resolution text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS error_code text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS created_by uuid references auth.users(id) on delete set null;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS ready_at timestamp with time zone;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Update constraints safely
DO $$ BEGIN
  ALTER TABLE video_assets DROP CONSTRAINT IF EXISTS video_assets_status_check;
  ALTER TABLE video_assets ADD CONSTRAINT video_assets_status_check 
    CHECK (status IN ('pending', 'uploading', 'processing', 'ready', 'errored', 'error', 'archived'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE video_assets DROP CONSTRAINT IF EXISTS video_assets_provider_check;
  ALTER TABLE video_assets ADD CONSTRAINT video_assets_provider_check 
    CHECK (provider = 'mux');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Partial unique indexes (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_assets_mux_upload_id ON video_assets (mux_upload_id) WHERE mux_upload_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_assets_mux_asset_id ON video_assets (mux_asset_id) WHERE mux_asset_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_assets_mux_playback_id ON video_assets (mux_playback_id) WHERE mux_playback_id IS NOT NULL;

-- Backfill existing legacy columns
UPDATE video_assets 
SET mux_asset_id = provider_asset_id 
WHERE mux_asset_id IS NULL AND provider_asset_id IS NOT NULL;

UPDATE video_assets 
SET mux_playback_id = playback_id 
WHERE mux_playback_id IS NULL AND playback_id IS NOT NULL;

-- 2. LESSON_VIDEOS (Normalized Relationship)
CREATE TABLE IF NOT EXISTS lesson_videos (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references lessons(id) on delete restrict not null,
  video_asset_id uuid references video_assets(id) on delete restrict not null,
  is_primary boolean default true not null,
  position integer default 1 not null,
  published_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Constraint: Impede dois vídeos primários ativos para a mesma aula
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_videos_primary_unique 
ON lesson_videos (lesson_id) 
WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson ON lesson_videos (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_asset ON lesson_videos (video_asset_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS tr_lesson_videos_modtime ON lesson_videos;
CREATE TRIGGER tr_lesson_videos_modtime 
  BEFORE UPDATE ON lesson_videos 
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Backfill from lessons where video_asset_id is present
INSERT INTO lesson_videos (lesson_id, video_asset_id, is_primary, position)
SELECT l.id, l.video_asset_id, true, 1
FROM lessons l
WHERE l.video_asset_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lesson_videos lv WHERE lv.lesson_id = l.id AND lv.video_asset_id = l.video_asset_id
  );

-- 3. VIDEO_UPLOADS (Upload Session Tracking)
CREATE TABLE IF NOT EXISTS video_uploads (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references lessons(id) on delete set null,
  video_asset_id uuid references video_assets(id) on delete cascade,
  mux_upload_id text unique not null,
  requested_by uuid references auth.users(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'waiting_file', 'asset_created', 'errored', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads (status);
CREATE INDEX IF NOT EXISTS idx_video_uploads_asset ON video_uploads (video_asset_id);

DROP TRIGGER IF EXISTS tr_video_uploads_modtime ON video_uploads;
CREATE TRIGGER tr_video_uploads_modtime 
  BEFORE UPDATE ON video_uploads 
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 4. EXTEND WEBHOOK_EVENTS
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS provider_event_id text;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processing_status text default 'pending';
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS retry_count integer default 0;

-- Backfill provider_event_id from external_id
UPDATE webhook_events
SET provider_event_id = external_id
WHERE provider_event_id IS NULL AND external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_event 
ON webhook_events (provider, provider_event_id) 
WHERE provider_event_id IS NOT NULL;

-- 5. PLAYBACK_SESSIONS (Auditing & Session Tracking without storing JWT)
CREATE TABLE IF NOT EXISTS playback_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade not null,
  video_asset_id uuid references video_assets(id) on delete set null,
  session_hash text not null,
  ip_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_playback_sessions_user ON playback_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_lesson ON playback_sessions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_hash ON playback_sessions (session_hash);

-- 6. RBAC PERMISSIONS FOR VIDEO MANAGEMENT
INSERT INTO admin_permissions (key, resource, action, risk_level, description)
VALUES ('courses.videos.manage', 'courses', 'videos.manage', 'high', 'Manage Mux videos and direct uploads')
ON CONFLICT (key) DO UPDATE SET 
  description = EXCLUDED.description,
  risk_level = EXCLUDED.risk_level;

-- Grant courses.videos.manage to super_admin and content_admin
DO $$
DECLARE
  v_perm_id uuid;
  v_super_id uuid;
  v_content_id uuid;
BEGIN
  SELECT id INTO v_perm_id FROM admin_permissions WHERE key = 'courses.videos.manage';
  SELECT id INTO v_super_id FROM admin_roles WHERE key = 'super_admin';
  SELECT id INTO v_content_id FROM admin_roles WHERE key = 'content_admin';

  IF v_perm_id IS NOT NULL AND v_super_id IS NOT NULL THEN
    INSERT INTO admin_role_permissions (role_id, permission_id)
    VALUES (v_super_id, v_perm_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_perm_id IS NOT NULL AND v_content_id IS NOT NULL THEN
    INSERT INTO admin_role_permissions (role_id, permission_id)
    VALUES (v_content_id, v_perm_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Admins manage video assets" ON video_assets;
DROP POLICY IF EXISTS "Admins manage lesson videos" ON lesson_videos;
DROP POLICY IF EXISTS "Members view lesson videos if entitled" ON lesson_videos;
DROP POLICY IF EXISTS "Admins manage video uploads" ON video_uploads;
DROP POLICY IF EXISTS "Users view own playback sessions" ON playback_sessions;
DROP POLICY IF EXISTS "Admins view all playback sessions" ON playback_sessions;
DROP POLICY IF EXISTS "Admins read webhook events" ON webhook_events;

-- Policies for video_assets
CREATE POLICY "Admins manage video assets" ON video_assets
  FOR ALL USING (
    (has_permission('courses.videos.manage') OR has_permission('content.manage')) 
    AND (auth.jwt()->>'aal' = 'aal2')
  );

-- Policies for lesson_videos
CREATE POLICY "Members view lesson videos if entitled" ON lesson_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN course_modules m ON m.id = l.module_id
      WHERE l.id = lesson_videos.lesson_id
        AND l.status = 'published'
        AND has_course_access(m.course_id)
    )
  );

CREATE POLICY "Admins manage lesson videos" ON lesson_videos
  FOR ALL USING (
    (has_permission('courses.videos.manage') OR has_permission('content.manage'))
    AND (auth.jwt()->>'aal' = 'aal2')
  );

-- Policies for video_uploads
CREATE POLICY "Admins manage video uploads" ON video_uploads
  FOR ALL USING (
    has_permission('courses.videos.manage')
    AND (auth.jwt()->>'aal' = 'aal2')
  );

-- Policies for playback_sessions
CREATE POLICY "Users view own playback sessions" ON playback_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all playback sessions" ON playback_sessions
  FOR SELECT USING (
    has_permission('audit.read')
    AND (auth.jwt()->>'aal' = 'aal2')
  );

-- Policies for webhook_events
CREATE POLICY "Admins read webhook events" ON webhook_events
  FOR SELECT USING (
    has_permission('audit.read')
    AND (auth.jwt()->>'aal' = 'aal2')
  );
