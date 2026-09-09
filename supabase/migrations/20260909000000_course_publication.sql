BEGIN;
-- Covers are intentionally public catalog images. Never store lesson videos here.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('public_media','public_media',true,3145728,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.validate_course_publication(p_course uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE bad_title text;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM courses WHERE id=p_course AND length(trim(title))>0 AND length(trim(slug))>0 AND status<>'archived') THEN
    RAISE EXCEPTION 'Preencha o título e o endereço de um curso ativo.';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM lessons l JOIN course_modules m ON m.id=l.module_id WHERE m.course_id=p_course AND m.status<>'archived' AND l.status<>'archived') THEN
    RAISE EXCEPTION 'Adicione pelo menos uma aula antes de publicar.';
  END IF;
  SELECT l.title INTO bad_title FROM lessons l JOIN course_modules m ON m.id=l.module_id
  LEFT JOIN video_assets v ON v.id=l.video_asset_id
  WHERE m.course_id=p_course AND m.status<>'archived' AND l.status<>'archived' AND l.type='video'
    AND (v.id IS NULL OR v.status<>'ready' OR v.playback_policy<>'signed' OR v.mux_playback_id IS NULL) LIMIT 1;
  IF bad_title IS NOT NULL THEN RAISE EXCEPTION 'Envie e confirme um vídeo pronto para a aula: %',bad_title; END IF;
  SELECT l.title INTO bad_title FROM lessons l JOIN course_modules m ON m.id=l.module_id
  LEFT JOIN external_resources e ON e.id=l.external_resource_id
  WHERE m.course_id=p_course AND m.status<>'archived' AND l.status<>'archived' AND l.type='external_link'
    AND (e.id IS NULL OR e.status<>'active') LIMIT 1;
  IF bad_title IS NOT NULL THEN RAISE EXCEPTION 'Configure o link da aula: %',bad_title; END IF;
  SELECT l.title INTO bad_title FROM lessons l JOIN course_modules m ON m.id=l.module_id
  WHERE m.course_id=p_course AND m.status<>'archived' AND l.status<>'archived' AND l.type='pdf_material'
    AND NOT EXISTS(SELECT 1 FROM lesson_materials t WHERE t.lesson_id=l.id AND t.status='published' AND t.storage_path IS NOT NULL) LIMIT 1;
  IF bad_title IS NOT NULL THEN RAISE EXCEPTION 'Adicione o material da aula: %',bad_title; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.publish_course_bundle(p_course uuid,p_actor uuid,p_version integer DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE current_version integer;
BEGIN
  SELECT version INTO current_version FROM courses WHERE id=p_course FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Curso não encontrado.'; END IF;
  IF p_version IS NOT NULL AND current_version<>p_version THEN RAISE EXCEPTION 'O curso foi atualizado. Recarregue antes de publicar.'; END IF;
  PERFORM 1 FROM course_modules WHERE course_id=p_course FOR UPDATE;
  PERFORM 1 FROM lessons WHERE module_id IN(SELECT id FROM course_modules WHERE course_id=p_course) FOR UPDATE;
  PERFORM validate_course_publication(p_course);
  UPDATE lessons SET status='published',is_published=true WHERE status<>'archived'
    AND module_id IN(SELECT id FROM course_modules WHERE course_id=p_course AND status<>'archived');
  UPDATE course_modules SET status='published' WHERE course_id=p_course AND status<>'archived';
  UPDATE courses SET status='published',is_published=true,version=current_version+1,updated_at=now() WHERE id=p_course;
  UPDATE publication_schedules SET status='cancelled',updated_at=now() WHERE entity_type='course' AND entity_id=p_course AND status='scheduled';
  INSERT INTO admin_audit_logs(actor_id,action,resource_type,resource_id,details)
    VALUES(p_actor,'publish_course','course',p_course,jsonb_build_object('version',current_version+1));
  RETURN current_version+1;
END $$;

CREATE OR REPLACE FUNCTION public.schedule_course_publication(p_course uuid,p_actor uuid,p_at timestamptz,p_version integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c courses%ROWTYPE;
BEGIN
  SELECT * INTO c FROM courses WHERE id=p_course FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Curso não encontrado.'; END IF;
  IF c.version<>p_version THEN RAISE EXCEPTION 'O curso foi atualizado. Recarregue antes de agendar.'; END IF;
  IF p_at IS NULL THEN
    UPDATE publication_schedules SET status='cancelled',updated_at=now() WHERE entity_type='course' AND entity_id=p_course AND status='scheduled';
    RETURN;
  END IF;
  IF c.status='published' THEN RAISE EXCEPTION 'Este curso já está publicado. Use Publicar alterações para liberar novas aulas.'; END IF;
  IF p_at IS NULL OR p_at<=now() THEN RAISE EXCEPTION 'Escolha uma data futura.'; END IF;
  PERFORM validate_course_publication(p_course);
  INSERT INTO publication_schedules(entity_type,entity_id,publish_at,timezone,status,created_by,approved_by,idempotency_key)
    VALUES('course',p_course,p_at,'America/Sao_Paulo','scheduled',p_actor,p_actor,'course:'||p_course)
  ON CONFLICT(idempotency_key) DO UPDATE SET publish_at=excluded.publish_at,status='scheduled',created_by=p_actor,approved_by=p_actor,last_error=NULL,updated_at=now();
END $$;

CREATE OR REPLACE FUNCTION public.run_course_publications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s record;
BEGIN
  FOR s IN SELECT id,entity_id,created_by FROM publication_schedules WHERE entity_type='course' AND status='scheduled' AND publish_at<=now() ORDER BY publish_at LIMIT 50 LOOP
    BEGIN
      PERFORM 1 FROM courses WHERE id=s.entity_id FOR UPDATE;
      PERFORM 1 FROM publication_schedules WHERE id=s.id AND status='scheduled' AND publish_at<=now() FOR UPDATE;
      IF NOT FOUND THEN CONTINUE; END IF;
      PERFORM publish_course_bundle(s.entity_id,s.created_by);
      UPDATE publication_schedules SET status='completed',last_error=NULL,updated_at=now() WHERE id=s.id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE publication_schedules SET status='failed',last_error=SQLERRM,updated_at=now() WHERE id=s.id;
    END;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.validate_course_publication(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.publish_course_bundle(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.schedule_course_publication(uuid,uuid,timestamptz,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.run_course_publications() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.validate_course_publication(uuid),public.publish_course_bundle(uuid,uuid,integer),public.schedule_course_publication(uuid,uuid,timestamptz,integer),public.run_course_publications() TO service_role;
CREATE INDEX IF NOT EXISTS idx_course_publications_due ON publication_schedules(publish_at) WHERE entity_type='course' AND status='scheduled';
COMMIT;

-- Runs entirely inside Postgres; no public endpoint or additional credentials.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('amf-course-publication','* * * * *','SELECT public.run_course_publications()');
