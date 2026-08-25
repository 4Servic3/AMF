-- Migration: feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key varchar(255) UNIQUE NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Qualquer usuário (anon ou authenticated) pode ler as flags
CREATE POLICY "Feature flags são públicas para leitura"
ON public.feature_flags
FOR SELECT
TO public
USING (true);

-- Apenas admins podem alterar
CREATE POLICY "Admins podem atualizar feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Inserir flags iniciais obrigatórias
INSERT INTO public.feature_flags (key, enabled, description) VALUES
('member_courses_enabled', true, 'Acesso aos cursos'),
('member_cases_enabled', false, 'Acesso aos casos clínicos'),
('member_stories_enabled', false, 'Acesso aos stories da home'),
('member_close_friends_enabled', false, 'Acesso ao close friends'),
('member_home_news_enabled', false, 'Acesso às novidades na home'),
('member_academy_enabled', false, 'Acesso à academia flutuante')
ON CONFLICT (key) DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    description = EXCLUDED.description;
