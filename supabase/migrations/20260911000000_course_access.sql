BEGIN;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS all_students boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.has_course_access(course_uuid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT auth.uid() IS NOT NULL AND (
 EXISTS(SELECT 1 FROM courses WHERE id=course_uuid AND all_students AND status='published') OR
 EXISTS(SELECT 1 FROM entitlements WHERE profile_id=auth.uid() AND resource_id=course_uuid
  AND resource_type='course' AND status='active' AND starts_at<=now() AND (expires_at IS NULL OR expires_at>now()))
);
$$;
REVOKE ALL ON FUNCTION public.has_course_access(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.course_access_admin(p_course uuid,p_actor uuid,p_email text DEFAULT NULL,p_expires timestamptz DEFAULT NULL,p_all boolean DEFAULT NULL,p_revoke uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE uid uuid; eid uuid;
BEGIN
 PERFORM 1 FROM courses WHERE id=p_course FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Curso não encontrado.'; END IF;
 IF p_all IS NOT NULL THEN
  UPDATE courses SET all_students=p_all WHERE id=p_course;
 ELSIF p_revoke IS NOT NULL THEN
  UPDATE entitlements SET status='revoked' WHERE id=p_revoke AND resource_id=p_course AND resource_type='course';
  IF NOT FOUND THEN RAISE EXCEPTION 'Acesso não encontrado.'; END IF;
 ELSIF p_email IS NOT NULL THEN
  SELECT id INTO uid FROM auth.users WHERE lower(email)=lower(trim(p_email)) AND deleted_at IS NULL;
  IF uid IS NULL THEN RAISE EXCEPTION 'E-mail não cadastrado. O aluno precisa criar uma conta na plataforma primeiro.'; END IF;
  IF p_expires IS NOT NULL AND p_expires<=now() THEN RAISE EXCEPTION 'Escolha uma data de expiração futura.'; END IF;
  SELECT id INTO eid FROM entitlements WHERE profile_id=uid AND resource_id=p_course AND resource_type='course' ORDER BY created_at DESC LIMIT 1;
  IF eid IS NULL THEN
   INSERT INTO entitlements(profile_id,resource_id,resource_type,source_type,origin,status,starts_at,expires_at)
   VALUES(uid,p_course,'course','manual','admin_manual','active',now(),p_expires);
  ELSE
   UPDATE entitlements SET status='active',starts_at=now(),expires_at=p_expires WHERE id=eid;
  END IF;
 END IF;
 IF p_email IS NOT NULL OR p_all IS NOT NULL OR p_revoke IS NOT NULL THEN
  INSERT INTO admin_audit_logs(actor_id,action,resource_type,resource_id,details)
  VALUES(p_actor,'course_access_changed','course',p_course,jsonb_build_object('profile_id',uid,'all_students',p_all,'revoked_id',p_revoke));
 END IF;
 RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e.id,'profile_id',e.profile_id,'status',e.status,'starts_at',e.starts_at,'expires_at',e.expires_at,
 'users',jsonb_build_object('email',u.email,'first_name',u.raw_user_meta_data->>'first_name','last_name',u.raw_user_meta_data->>'last_name')) ORDER BY e.created_at DESC)
 FROM entitlements e LEFT JOIN auth.users u ON u.id=e.profile_id WHERE e.resource_id=p_course AND e.resource_type='course'),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.course_access_admin(uuid,uuid,text,timestamptz,boolean,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.course_access_admin(uuid,uuid,text,timestamptz,boolean,uuid) TO service_role;
COMMIT;
