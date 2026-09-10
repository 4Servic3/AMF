BEGIN;
ALTER TABLE video_uploads ADD COLUMN IF NOT EXISTS activated_at timestamptz;
CREATE OR REPLACE FUNCTION public.activate_uploaded_video(p_video uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE u video_uploads%ROWTYPE; lesson uuid;
BEGIN
  SELECT lesson_id INTO lesson FROM video_uploads WHERE video_asset_id=p_video LIMIT 1;
  IF lesson IS NULL THEN RETURN; END IF;
  PERFORM 1 FROM lessons WHERE id=lesson FOR UPDATE;
  SELECT * INTO u FROM video_uploads WHERE lesson_id=lesson ORDER BY created_at DESC,id DESC LIMIT 1 FOR UPDATE;
  IF u.video_asset_id<>p_video OR u.status='cancelled' OR u.activated_at IS NOT NULL THEN RETURN; END IF;
  IF NOT EXISTS(SELECT 1 FROM video_assets WHERE id=p_video AND status='ready' AND deleted_at IS NULL) THEN RETURN; END IF;
  PERFORM activate_lesson_video(lesson,p_video,u.requested_by,'Vínculo automático após envio');
  UPDATE video_uploads SET activated_at=now() WHERE id=u.id;
END $$;
REVOKE ALL ON FUNCTION public.activate_uploaded_video(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.activate_uploaded_video(uuid) TO service_role;

ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS bucket_name text NOT NULL DEFAULT 'course-materials';
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS download_policy text NOT NULL DEFAULT 'download';
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS view_policy text NOT NULL DEFAULT 'private';
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson ON lesson_materials(lesson_id,status);
INSERT INTO storage.buckets(id,name,public,file_size_limit)
VALUES('lesson-files','lesson-files',false,52428800) ON CONFLICT(id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.finish_lesson_material(p_material uuid,p_lesson uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE m lesson_materials%ROWTYPE;
BEGIN
  PERFORM 1 FROM lessons WHERE id=p_lesson FOR UPDATE;
  SELECT * INTO m FROM lesson_materials WHERE id=p_material AND lesson_id=p_lesson FOR UPDATE;
  IF NOT FOUND OR m.status='archived' THEN RAISE EXCEPTION 'material_not_found'; END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id=m.bucket_name AND name=m.storage_path
    AND (metadata->>'size')::bigint=m.size_bytes) THEN RAISE EXCEPTION 'upload_incomplete'; END IF;
  UPDATE lesson_materials SET status='published' WHERE id=m.id;
  UPDATE lessons SET type='pdf_material' WHERE id=p_lesson AND video_asset_id IS NULL AND type='video';
END $$;
REVOKE ALL ON FUNCTION public.finish_lesson_material(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_lesson_material(uuid,uuid) TO service_role;
COMMIT;
