BEGIN;
ALTER TABLE public.case_story_videos ALTER COLUMN mux_upload_id DROP NOT NULL;
ALTER TABLE public.case_story_videos ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'video' CHECK(media_type IN ('video','image'));
ALTER TABLE public.case_story_videos ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.case_story_videos ADD COLUMN IF NOT EXISTS size_bytes bigint;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('case-story-images','case-story-images',false,10485760,ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.publish_case_story_image(p_story uuid) RETURNS void
LANGUAGE plpgsql SET search_path=public AS $$
DECLARE s case_story_videos%ROWTYPE;
BEGIN
  SELECT * INTO s FROM case_story_videos WHERE id=p_story AND media_type='image' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'story_missing'; END IF;
  IF s.status='published' THEN RETURN; END IF;
  IF s.status<>'processing' THEN RAISE EXCEPTION 'story_unavailable'; END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='case-story-images' AND name=s.storage_path
    AND (metadata->>'size')::bigint=s.size_bytes AND metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp')) THEN RAISE EXCEPTION 'upload_incomplete'; END IF;
  PERFORM id FROM cases WHERE id=s.case_id AND status<>'archived' AND visibility IN ('free','authenticated') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'case_unavailable'; END IF;
  UPDATE cases SET status='published',published_at=coalesce(published_at,now()) WHERE id=s.case_id;
  UPDATE case_story_videos SET status='published',duration_seconds=8,published_at=now() WHERE id=p_story;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_case_story_image(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_case_story_image(uuid) TO service_role;
COMMIT;
