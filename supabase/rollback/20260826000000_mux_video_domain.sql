-- MANUAL ONLY. Never include this destructive recovery script in forward migrations.
-- Rollback: Mux Video Domain & RLS Hardening
-- Reverts tables and constraints created by 20260826000000_mux_video_domain.sql

-- 1. DROP POLICIES
DROP POLICY IF EXISTS "Members view lesson videos if entitled" ON lesson_videos;
DROP POLICY IF EXISTS "Admins manage lesson videos" ON lesson_videos;
DROP POLICY IF EXISTS "Admins manage video uploads" ON video_uploads;
DROP POLICY IF EXISTS "Users view own playback sessions" ON playback_sessions;
DROP POLICY IF EXISTS "Admins view all playback sessions" ON playback_sessions;
DROP POLICY IF EXISTS "Admins manage video assets" ON video_assets;

-- Restore original video_assets admin policy
CREATE POLICY "Admins manage video assets" ON video_assets 
  FOR ALL USING (has_permission('content.manage') AND (auth.jwt()->>'aal' = 'aal2'));

-- 2. DROP NEW TABLES
DROP TABLE IF EXISTS playback_sessions;
DROP TABLE IF EXISTS video_uploads;
DROP TABLE IF EXISTS lesson_videos;

-- 3. DROP NEW INDEXES ON WEBHOOK_EVENTS AND VIDEO_ASSETS
DROP INDEX IF EXISTS idx_webhook_events_provider_event;
DROP INDEX IF EXISTS idx_video_assets_mux_upload_id;
DROP INDEX IF EXISTS idx_video_assets_mux_asset_id;
DROP INDEX IF EXISTS idx_video_assets_mux_playback_id;

-- 4. DROP NEW COLUMNS ON WEBHOOK_EVENTS
ALTER TABLE webhook_events DROP COLUMN IF EXISTS provider_event_id;
ALTER TABLE webhook_events DROP COLUMN IF EXISTS processing_status;
ALTER TABLE webhook_events DROP COLUMN IF EXISTS retry_count;

-- 5. DROP NEW COLUMNS ON VIDEO_ASSETS
ALTER TABLE video_assets DROP COLUMN IF EXISTS mux_upload_id;
ALTER TABLE video_assets DROP COLUMN IF EXISTS mux_asset_id;
ALTER TABLE video_assets DROP COLUMN IF EXISTS mux_playback_id;
ALTER TABLE video_assets DROP COLUMN IF EXISTS aspect_ratio;
ALTER TABLE video_assets DROP COLUMN IF EXISTS max_stored_resolution;
ALTER TABLE video_assets DROP COLUMN IF EXISTS title;
ALTER TABLE video_assets DROP COLUMN IF EXISTS error_code;
ALTER TABLE video_assets DROP COLUMN IF EXISTS error_message;
ALTER TABLE video_assets DROP COLUMN IF EXISTS created_by;
ALTER TABLE video_assets DROP COLUMN IF EXISTS ready_at;
ALTER TABLE video_assets DROP COLUMN IF EXISTS archived_at;
ALTER TABLE video_assets DROP COLUMN IF EXISTS deleted_at;

-- 6. REMOVE RBAC PERMISSION
DELETE FROM admin_role_permissions 
WHERE permission_id IN (SELECT id FROM admin_permissions WHERE key = 'courses.videos.manage');

DELETE FROM admin_permissions 
WHERE key = 'courses.videos.manage';
