-- Additive: preserve lessons, progress and all existing video assets.
BEGIN;
CREATE OR REPLACE FUNCTION public.register_lesson_upload(
  p_lesson_id uuid, p_video_id uuid, p_upload_id text, p_actor_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  PERFORM 1 FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;
  IF EXISTS (
    SELECT 1 FROM video_uploads u JOIN video_assets v ON v.id = u.video_asset_id
    WHERE u.lesson_id = p_lesson_id AND u.status IN ('waiting_file', 'asset_created')
      AND v.status IN ('pending', 'uploading', 'processing')
      AND u.created_at > now() - interval '24 hours'
  ) THEN RAISE EXCEPTION 'upload_in_progress'; END IF;
  INSERT INTO video_assets(id, provider, provider_asset_id, mux_upload_id, playback_policy, status, created_by)
    VALUES(p_video_id, 'mux', p_upload_id, p_upload_id, 'signed', 'pending', p_actor_id);
  INSERT INTO video_uploads(lesson_id,video_asset_id,mux_upload_id,requested_by,status)
    VALUES(p_lesson_id,p_video_id,p_upload_id,p_actor_id,'waiting_file');
END $$;

CREATE OR REPLACE FUNCTION public.activate_lesson_video(
  p_lesson_id uuid, p_video_id uuid, p_actor_id uuid, p_reason text DEFAULT 'Publicação de vídeo'
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_video video_assets%ROWTYPE; v_previous uuid; v_link uuid;
BEGIN
  SELECT video_asset_id INTO v_previous FROM lessons WHERE id=p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;
  SELECT * INTO v_video FROM video_assets WHERE id=p_video_id FOR SHARE;
  IF NOT FOUND OR v_video.status <> 'ready' OR v_video.playback_policy <> 'signed'
    OR v_video.mux_playback_id IS NULL THEN RAISE EXCEPTION 'video_not_ready'; END IF;
  UPDATE lesson_videos SET is_primary=false WHERE lesson_id=p_lesson_id AND is_primary;
  SELECT id INTO v_link FROM lesson_videos WHERE lesson_id=p_lesson_id AND video_asset_id=p_video_id LIMIT 1;
  IF v_link IS NULL THEN
    INSERT INTO lesson_videos(lesson_id,video_asset_id,is_primary) VALUES(p_lesson_id,p_video_id,true);
  ELSE
    UPDATE lesson_videos SET is_primary=true,published_at=now() WHERE id=v_link;
  END IF;
  UPDATE lessons SET video_asset_id=p_video_id,type='video',duration_seconds=v_video.duration_seconds WHERE id=p_lesson_id;
  -- The previous asset remains ready: it may be shared by another lesson.
  INSERT INTO admin_audit_logs(actor_id,action,resource_type,resource_id,reason,details)
    VALUES(p_actor_id,'publish_lesson_video','lesson',p_lesson_id,p_reason,
      jsonb_build_object('previousAssetId',v_previous,'newAssetId',p_video_id));
END $$;
REVOKE ALL ON FUNCTION public.register_lesson_upload(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.activate_lesson_video(uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_lesson_upload(uuid,uuid,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_lesson_video(uuid,uuid,uuid,text) TO service_role;
CREATE INDEX IF NOT EXISTS idx_video_uploads_lesson_created ON video_uploads(lesson_id,created_at DESC);
COMMIT;
