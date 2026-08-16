-- Insert products
insert into products (
  id, name, slug, subtitle, description, long_description, type, status, 
  is_free, featured, theme_color, image_url, cta_text, access_model, order_index
) values 
(
  '11111111-1111-1111-1111-111111111111',
  'Casos da Semana (Close Friends)',
  'casos-da-semana',
  'Acompanhe casos clínicos reais toda semana.',
  'Discussão de casos reais, exames, raciocínio clínico e conduta aplicável à rotina.',
  'O Casos da Semana (Close Friends) é a nossa assinatura contínua. Toda semana a Dra. Polyana traz um caso clínico real, do atendimento à alta (ou desfecho), mostrando o passo a passo do raciocínio diagnóstico e terapêutico.',
  'subscription',
  'active',
  false,
  true,
  '#4E887F', -- teal
  '/images/casos-da-semana.jpg',
  'Assinar agora',
  'recurring',
  1
),
(
  '22222222-2222-2222-2222-222222222222',
  'Imersão Clínica de Felinos — Parte 1',
  'imersao-parte-1',
  'O básico bem feito que salva vidas.',
  'Aprenda a base essencial para atender gatos com segurança no seu plantão.',
  'Curso completo cobrindo os principais desafios do atendimento inicial de felinos, triagem, manejo cat-friendly, fluidoterapia e emergências comuns.',
  'course',
  'active',
  false,
  false,
  '#65427A', -- purple
  '/images/imersao-p1.jpg',
  'Comprar Imersão',
  'lifetime',
  2
),
(
  '33333333-3333-3333-3333-333333333333',
  'Imersão Clínica de Felinos — Parte 2',
  'imersao-parte-2',
  'Aprofundamento em patologias específicas.',
  'Domine as doenças renais, hepáticas e endócrinas dos felinos.',
  'O segundo módulo da imersão se aprofunda nos sistemas, trazendo condutas atualizadas para DRC, lipidose, diabetes e hipertireoidismo.',
  'course',
  'active',
  false,
  false,
  '#65427A', -- purple
  '/images/imersao-p2.jpg',
  'Comprar Imersão P2',
  'lifetime',
  3
),
(
  '44444444-4444-4444-4444-444444444444',
  'Academia Completa',
  'academia-completa',
  'Todos os cursos e conteúdos em um só lugar.',
  'Acesso completo a todas as imersões, bônus e acervo de casos.',
  'A formação definitiva em Medicina Felina. Adquirindo a Academia Completa você tem acesso vitalício a todos os cursos atuais e um ano de Casos da Semana.',
  'bundle',
  'upcoming', -- upcoming status prevents purchase
  false,
  false,
  '#C6A15B', -- gold
  '/images/academia.jpg',
  'Em Breve',
  'lifetime',
  4
);

-- Profiles (Mock User)
insert into profiles (id, full_name, email, role)
values ('00000000-0000-0000-0000-000000000000', 'Dra. Polyana (Mock)', 'polyana@amf.com', 'member')
on conflict (id) do nothing;

-- Entitlements (Give access to Imersao P1)
insert into entitlements (id, profile_id, product_id, source_type, status)
values ('eeeee001-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'purchase', 'active')
on conflict (id) do nothing;

-- Courses
insert into courses (
  id, product_id, title, slug, description, cover_url, level, duration_hours, status, order_index, certificate_enabled, min_completion_percent
) values (
  'ccccccc1-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'Imersão Clínica de Felinos — Parte 1', 'imersao-parte-1', 'Aprenda a base essencial.', '/images/imersao-p1.jpg', 'Intermediário', 20, 'published', 1, true, 90
) on conflict (id) do nothing;

-- Modules
insert into course_modules (
  id, course_id, title, description, order_index, status
) values
('mmmmm001-0000-0000-0000-000000000000', 'ccccccc1-0000-0000-0000-000000000000', 'Módulo 1: O Início de Tudo', 'Princípios básicos e manejo.', 1, 'published'),
('mmmmm002-0000-0000-0000-000000000000', 'ccccccc1-0000-0000-0000-000000000000', 'Módulo 2: Casos Clínicos', 'Discussões reais.', 2, 'published')
on conflict (id) do nothing;

-- Lessons
insert into lessons (
  id, module_id, title, slug, type, duration_seconds, order_index, video_id, status, is_required
) values
('lllllll1-0000-0000-0000-000000000000', 'mmmmm001-0000-0000-0000-000000000000', 'Aula 1: A Abordagem Cat Friendly', 'abordagem-cat-friendly', 'video', 1200, 1, 'v_demo_1', 'published', true),
('lllllll2-0000-0000-0000-000000000000', 'mmmmm001-0000-0000-0000-000000000000', 'Aula 2: Semiologia Felina', 'semiologia-felina', 'video', 1800, 2, 'v_demo_2', 'published', true),
('lllllll3-0000-0000-0000-000000000000', 'mmmmm002-0000-0000-0000-000000000000', 'Aula 3: Desidratação', 'desidratacao', 'video', 2100, 1, 'v_demo_3', 'published', true),
('lllllll4-0000-0000-0000-000000000000', 'mmmmm002-0000-0000-0000-000000000000', 'Aula 4: Fluidoterapia na prática', 'fluidoterapia', 'video', 2500, 2, 'v_demo_4', 'published', true)
on conflict (id) do nothing;

-- Progress (Mocking partial progress on Aula 1 and 2)
insert into lesson_progress (
  id, profile_id, lesson_id, is_completed, last_position_seconds, total_watch_time, completed_by
) values
('ppppppp1-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'lllllll1-0000-0000-0000-000000000000', true, 1200, 1200, 'auto'),
('ppppppp2-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'lllllll2-0000-0000-0000-000000000000', false, 450, 450, null)
on conflict (id) do nothing;

-- ==========================================
-- STAGE 4: CASOS DA SEMANA (STORIES)
-- ==========================================

-- Story Categories
insert into story_categories (id, name, slug, color, order_index) values
('cat00001-0000-0000-0000-000000000000', 'FeLV', 'felv', '#4E887F', 1),
('cat00002-0000-0000-0000-000000000000', 'Doença Renal Crônica', 'drc', '#D97868', 2),
('cat00003-0000-0000-0000-000000000000', 'Oncologia', 'oncologia', '#65427A', 3),
('cat00004-0000-0000-0000-000000000000', 'Gastroenterologia', 'gastro', '#C6A15B', 4)
on conflict (id) do nothing;

-- Story Groups (Caso Demonstração)
insert into story_groups (
  id, title, slug, summary, category_id, product_id, author_id, 
  status, is_featured, free_preview_count, thumbnail_url, published_at, tags, keep_in_archive
) values (
  'grp00001-0000-0000-0000-000000000000', 
  'Obstrução Uretral em Felino Jovem', 
  'obstrucao-uretral-jovem',
  'Manejo de emergência, desobstrução e fluidoterapia de um gato de 2 anos.',
  'cat00002-0000-0000-0000-000000000000', -- DRC / Urinário
  '11111111-1111-1111-1111-111111111111', -- Produto "Casos da Semana"
  '00000000-0000-0000-0000-000000000000', -- Dra. Polyana
  'published', true, 2, '/images/caso-obstrucao.jpg', now(), '["emergência", "obstrução", "fluidoterapia"]'::jsonb, true
) on conflict (id) do nothing;

-- Story Items
insert into story_items (
  id, group_id, media_url, media_type, duration_seconds, caption, order_index, is_free
) values 
('itm00001-0000-0000-0000-000000000000', 'grp00001-0000-0000-0000-000000000000', '/videos/story_demo_1.mp4', 'video', 15, 'Paciente chegou em decúbito, vocalizando muito.', 1, true),
('itm00002-0000-0000-0000-000000000000', 'grp00001-0000-0000-0000-000000000000', '/images/story_demo_2.jpg', 'image', 10, 'Bexiga extremamente repleta e dura à palpação.', 2, true),
('itm00003-0000-0000-0000-000000000000', 'grp00001-0000-0000-0000-000000000000', '/videos/story_demo_3.mp4', 'video', 20, 'Iniciando o protocolo de sedação e acesso venoso...', 3, false),
('itm00004-0000-0000-0000-000000000000', 'grp00001-0000-0000-0000-000000000000', '/images/story_demo_4.jpg', 'image', 15, 'Exames de sangue: potássio lá em cima! Veja a conduta.', 4, false)
on conflict (id) do nothing;
