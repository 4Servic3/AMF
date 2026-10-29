-- Avisos pessoais: com profile_id, a notificação aparece só para aquele aluno
-- (por exemplo, a resposta do suporte). Sem profile_id continua indo para todos.
BEGIN;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS notifications_profile_created_idx ON public.notifications (profile_id, created_at DESC);
COMMIT;
