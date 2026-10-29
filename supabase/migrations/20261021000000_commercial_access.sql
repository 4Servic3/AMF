-- Modelo comercial único: produtos vendáveis, checkout por produto e acesso aos casos.
-- Idempotente. Não concede acesso a nenhum aluno.
BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS checkout_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unlocks_cases boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_checkout_url_https CHECK (checkout_url IS NULL OR checkout_url ~ '^https://[^\s]+$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS entitlements_profile_resource_idx ON entitlements(profile_id, resource_type, resource_id) WHERE status = 'active';

-- Produtos de lançamento. IDs fixos para que código e webhook possam referenciá-los.
UPDATE products SET slug = 'planilha-doses-seguras-felinos', sort_order = 20
 WHERE id = 'f6748b06-8efa-4dc6-a28f-96a17d14b7fd' AND slug IS NULL;

INSERT INTO products (id, name, description, type, status, is_free, featured, slug, sort_order)
VALUES ('8c9f8d73-766d-4226-b2d9-417bcbef0477', 'Imersão Clínica de Felinos — Parte 1',
        'Curso completo com aulas gravadas, materiais em PDF e grupo de network.', 'course', 'active', false, true,
        'imersao-clinica-de-felinos-parte-1', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, description, type, status, is_free, featured, slug, unlocks_cases, sort_order)
VALUES ('7926e829-a202-4e6d-a4fd-8657e10d4405', 'Casos Clínicos AMF',
        'Acesso completo aos stories e ao arquivo de casos clínicos.', 'subscription', 'active', false, false,
        'casos-clinicos', true, 30)
ON CONFLICT (id) DO NOTHING;

UPDATE courses SET product_id = '8c9f8d73-766d-4226-b2d9-417bcbef0477'
 WHERE id = '918c176f-8d14-43a9-89e9-67aa43820a9d' AND product_id IS NULL;

-- Acesso a produto avulso (planilha, casos): grant próprio, vigente e produto ativo.
CREATE OR REPLACE FUNCTION public.has_product_access(product_uuid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM entitlements e JOIN products p ON p.id = e.resource_id
    WHERE e.profile_id = auth.uid() AND e.resource_type = 'product' AND e.resource_id = product_uuid
      AND e.status = 'active' AND e.starts_at <= now() AND (e.expires_at IS NULL OR e.expires_at > now())
      AND p.status = 'active');
$$;

-- Casos completos: produto marcado como "libera casos" comprado diretamente,
-- ou curso publicado cujo produto libera casos (inclui liberação geral do curso).
CREATE OR REPLACE FUNCTION public.has_cases_access() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM entitlements e JOIN products p ON p.id = e.resource_id
      WHERE e.profile_id = auth.uid() AND e.resource_type = 'product' AND p.unlocks_cases AND p.status = 'active'
        AND e.status = 'active' AND e.starts_at <= now() AND (e.expires_at IS NULL OR e.expires_at > now()))
    OR EXISTS (
      SELECT 1 FROM courses c JOIN products p ON p.id = c.product_id
      WHERE p.unlocks_cases AND p.status = 'active' AND c.status = 'published' AND public.has_course_access(c.id))
  );
$$;

-- Resumo único para a interface do aluno: um round-trip, mesma regra do banco.
CREATE OR REPLACE FUNCTION public.member_access_summary() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'courses', COALESCE((SELECT jsonb_agg(c.id) FROM courses c WHERE c.status = 'published' AND public.has_course_access(c.id)), '[]'::jsonb),
    'products', COALESCE((SELECT jsonb_agg(DISTINCT p.id) FROM products p WHERE p.status = 'active' AND public.has_product_access(p.id)), '[]'::jsonb),
    'cases', public.has_cases_access()
  ) END;
$$;

REVOKE ALL ON FUNCTION public.has_product_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_cases_access() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.member_access_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_product_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_cases_access() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.member_access_summary() TO authenticated, service_role;

-- Concessão/revogação administrativa de produto avulso, com auditoria na mesma transação.
CREATE OR REPLACE FUNCTION public.product_access_admin(p_product uuid, p_actor uuid, p_profile uuid DEFAULT NULL,
  p_expires timestamptz DEFAULT NULL, p_revoke uuid DEFAULT NULL, p_reason text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE eid uuid;
BEGIN
  PERFORM 1 FROM products WHERE id = p_product AND type <> 'course' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado ou é um curso (use o acesso do curso).'; END IF;
  IF p_revoke IS NOT NULL THEN
    UPDATE entitlements SET status = 'revoked' WHERE id = p_revoke AND resource_id = p_product AND resource_type = 'product'
      RETURNING id INTO eid;
    IF eid IS NULL THEN RAISE EXCEPTION 'Acesso não encontrado.'; END IF;
  ELSIF p_profile IS NOT NULL THEN
    IF p_expires IS NOT NULL AND p_expires <= now() THEN RAISE EXCEPTION 'Escolha uma data de expiração futura.'; END IF;
    PERFORM 1 FROM profiles WHERE id = p_profile;
    IF NOT FOUND THEN RAISE EXCEPTION 'Aluno não encontrado.'; END IF;
    SELECT id INTO eid FROM entitlements WHERE profile_id = p_profile AND resource_id = p_product AND resource_type = 'product'
      ORDER BY created_at DESC LIMIT 1;
    IF eid IS NULL THEN
      INSERT INTO entitlements (profile_id, resource_id, resource_type, source_type, origin, status, starts_at, expires_at)
      VALUES (p_profile, p_product, 'product', 'manual', 'admin_manual', 'active', now(), p_expires) RETURNING id INTO eid;
    ELSE
      UPDATE entitlements SET status = 'active', starts_at = now(), expires_at = p_expires WHERE id = eid;
    END IF;
  ELSE
    RAISE EXCEPTION 'Informe o aluno ou o acesso a revogar.';
  END IF;
  INSERT INTO admin_audit_logs (actor_id, action, resource_type, resource_id, reason, details)
  VALUES (p_actor, CASE WHEN p_revoke IS NULL THEN 'grant_product_access' ELSE 'revoke_product_access' END, 'product', p_product,
          p_reason, jsonb_build_object('profile_id', p_profile, 'entitlement_id', eid, 'expires_at', p_expires));
  RETURN eid;
END $$;
REVOKE ALL ON FUNCTION public.product_access_admin(uuid, uuid, uuid, timestamptz, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.product_access_admin(uuid, uuid, uuid, timestamptz, uuid, text) TO service_role;

COMMIT;
