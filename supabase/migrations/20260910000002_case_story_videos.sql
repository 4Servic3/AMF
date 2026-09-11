BEGIN;
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  visibility text NOT NULL DEFAULT 'authenticated', author_id uuid NOT NULL REFERENCES auth.users(id),
  published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cases FROM anon, authenticated;
GRANT ALL ON public.cases TO service_role;
CREATE TABLE IF NOT EXISTS public.case_story_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  caption text NOT NULL DEFAULT '',
  mux_upload_id text NOT NULL UNIQUE,
  mux_asset_id text UNIQUE,
  mux_playback_id text,
  duration_seconds integer,
  status text NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','published','error','archived')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX IF NOT EXISTS case_story_videos_case_order ON public.case_story_videos(case_id,created_at);
ALTER TABLE public.case_story_videos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.case_story_videos FROM anon, authenticated;
GRANT ALL ON public.case_story_videos TO service_role;

CREATE OR REPLACE FUNCTION public.publish_case_story(p_story uuid,p_asset text,p_playback text,p_duration integer)
RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_case uuid;
BEGIN
  SELECT case_id INTO v_case FROM case_story_videos WHERE id=p_story AND status='processing' FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF nullif(p_asset,'') IS NULL OR nullif(p_playback,'') IS NULL OR p_duration IS NULL OR p_duration<=0 THEN RAISE EXCEPTION 'invalid_video'; END IF;
  PERFORM id FROM cases WHERE id=v_case AND status<>'archived' AND visibility IN ('free','authenticated') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'case_unavailable'; END IF;
  UPDATE cases SET status='published',published_at=coalesce(published_at,now()) WHERE id=v_case;
  UPDATE case_story_videos SET status='published',mux_asset_id=p_asset,mux_playback_id=p_playback,
    duration_seconds=p_duration,published_at=now() WHERE id=p_story;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_case_story(uuid,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_case_story(uuid,text,text,integer) TO service_role;
COMMIT;
