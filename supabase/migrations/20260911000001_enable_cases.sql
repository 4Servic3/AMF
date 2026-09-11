BEGIN;
CREATE TABLE IF NOT EXISTS public.feature_flags (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key varchar(255) UNIQUE NOT NULL,
 enabled boolean NOT NULL DEFAULT false, description text,
 updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.feature_flags TO anon,authenticated;
GRANT ALL ON public.feature_flags TO service_role;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feature_flags' AND policyname='Read feature flags') THEN
  CREATE POLICY "Read feature flags" ON public.feature_flags FOR SELECT TO anon,authenticated USING(true);
 END IF;
END $$;
INSERT INTO public.feature_flags(key,enabled,description) VALUES('member_cases_enabled',true,'Casos e stories publicados pela equipe')
ON CONFLICT(key) DO UPDATE SET enabled=true;
COMMIT;
