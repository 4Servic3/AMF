-- Datas do banner (permanente ou temporário) e agendamento de story.
-- Só acrescenta colunas e um gatilho; nada existente é apagado ou reescrito.
BEGIN;

-- Banner: vazio = permanente. Com datas, aparece só entre o início e o fim.
ALTER TABLE public.home_banners ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.home_banners ADD COLUMN IF NOT EXISTS ends_at timestamptz;
DO $$ BEGIN
  ALTER TABLE public.home_banners ADD CONSTRAINT home_banners_dates_order CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Story: vazio = sai assim que terminar de processar. Com data, fica guardado até lá.
ALTER TABLE public.case_story_videos ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- As funções que publicam stories gravam published_at = now(). Este gatilho
-- empurra para a data agendada, então o app só mostra o story a partir dela.
CREATE OR REPLACE FUNCTION public.case_story_apply_schedule() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.scheduled_for IS NOT NULL AND NEW.scheduled_for > now() THEN
    NEW.published_at := NEW.scheduled_for;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS case_story_apply_schedule ON public.case_story_videos;
CREATE TRIGGER case_story_apply_schedule BEFORE INSERT OR UPDATE OF status, published_at ON public.case_story_videos
  FOR EACH ROW EXECUTE FUNCTION public.case_story_apply_schedule();

COMMIT;
