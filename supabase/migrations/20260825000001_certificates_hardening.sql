-- Certificados e Hardening Final

create table if not exists certificates (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete cascade not null,
  course_id uuid references courses on delete cascade not null,
  title text not null,
  issue_date timestamp with time zone default timezone('utc'::text, now()) not null,
  validation_code text unique not null,
  status text default 'active' check (status in ('active', 'revoked')),
  revoked_at timestamp with time zone,
  revoked_by uuid references profiles,
  revoked_reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, course_id)
);

alter table certificates enable row level security;

-- Politicas
DO $$
BEGIN
  -- Users podem ver os proprios certificados
  CREATE POLICY "Users view own certificates" ON certificates FOR SELECT USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  -- Qualquer um pode verificar a autenticidade via validation_code (publico se precisar, senao removemos)
  -- Para essa versao: so admin ver todos.
  CREATE POLICY "Admins manage all certificates" ON certificates FOR ALL USING (has_permission('academy.manage') AND auth.jwt()->>'aal' = 'aal2');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
