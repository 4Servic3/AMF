-- Migration: Seed da Imersão Clínica de Felinos - Parte 1
-- Esta migration recria/extende as definições e insere o curso, módulos e materiais de forma idempotente.

DO $$
BEGIN
    -- Permitir 'coming_soon' nos status de lesson, caso não exista
    BEGIN
        ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
        ALTER TABLE lessons ADD CONSTRAINT lessons_status_check CHECK (status IN ('draft', 'published', 'archived', 'coming_soon'));
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

DO $$
DECLARE
    v_course_id uuid;
    v_module1_id uuid;
    v_module2_id uuid;
    v_module3_id uuid;
    v_network_ext_id uuid;
BEGIN
    -- 1. Verifica e insere o curso se não existir (idempotente pela slug)
    IF NOT EXISTS (SELECT 1 FROM courses WHERE slug = 'imersao-clinica-de-felinos-parte-1') THEN
        INSERT INTO courses (
            title, 
            slug, 
            short_description, 
            status, 
            visibility,
            certificate_enabled,
            course_type,
            version
        ) VALUES (
            'Imersão Clínica de Felinos — Parte 1',
            'imersao-clinica-de-felinos-parte-1',
            'Formação prática em clínica felina',
            'draft',
            'private',
            true,
            'course',
            1
        ) RETURNING id INTO v_course_id;

        -- 2. Cria os 3 módulos (Aulas Gravadas, Grupo de Network, Materiais da Aula)
        -- Módulo 1
        INSERT INTO course_modules (course_id, title, order_index, status, version)
        VALUES (v_course_id, 'Módulo 1 — Aulas gravadas', 1, 'published', 1)
        RETURNING id INTO v_module1_id;

        -- Módulo 2
        INSERT INTO course_modules (course_id, title, order_index, status, version)
        VALUES (v_course_id, 'Módulo 2 — Grupo de network', 2, 'published', 1)
        RETURNING id INTO v_module2_id;

        -- Módulo 3
        INSERT INTO course_modules (course_id, title, order_index, status, version)
        VALUES (v_course_id, 'Módulo 3 — Materiais da aula', 3, 'published', 1)
        RETURNING id INTO v_module3_id;

        -- 3. Inserir Itens (Lessons) nos Módulos

        -- Módulo 1: Aulas
        INSERT INTO lessons (module_id, title, slug, type, is_mandatory, order_index, status, version)
        VALUES 
            (v_module1_id, 'Aula 1', 'aula-1', 'video', true, 1, 'coming_soon', 1),
            (v_module1_id, 'Aula 2', 'aula-2', 'video', true, 2, 'coming_soon', 1);

        -- Módulo 2: Grupo de Network
        INSERT INTO external_resources (allowed_hostname, label, private_destination_url, status)
        VALUES ('whatsapp.com', 'Acesso ao grupo de network', 'https://chat.whatsapp.com/Fr5ZNrFAdsr7QoKmotgrbe', 'active')
        RETURNING id INTO v_network_ext_id;

        INSERT INTO lessons (module_id, title, slug, type, is_mandatory, external_resource_id, order_index, status, body, version)
        VALUES (
            v_module2_id, 
            'Acesso ao grupo de network', 
            'grupo-de-network', 
            'external_link', 
            false, 
            v_network_ext_id, 
            1, 
            'published',
            '{"description": "Espaço exclusivo para networking entre os participantes e médicos-veterinários"}'::jsonb,
            1
        );

        -- Módulo 3: Materiais (Lessons do tipo pdf_material)
        INSERT INTO lessons (module_id, title, slug, type, is_mandatory, order_index, status, version)
        VALUES 
            (v_module3_id, 'diabetes.pdf', 'diabetes-pdf', 'pdf_material', false, 1, 'published', 1),
            (v_module3_id, 'DRC.pdf', 'drc-pdf', 'pdf_material', false, 2, 'published', 1),
            (v_module3_id, 'ESPOROTRICOSE, Desafios na rotina clínica.pdf', 'esporotricose-pdf', 'pdf_material', false, 3, 'published', 1),
            (v_module3_id, 'FELV.pdf', 'felv-pdf', 'pdf_material', false, 4, 'published', 1),
            (v_module3_id, 'fiv.pdf', 'fiv-pdf', 'pdf_material', false, 5, 'published', 1),
            (v_module3_id, 'HIPERTIREOIDISMO FELINO (1).pdf', 'hipertireoidismo-felino-1-pdf', 'pdf_material', false, 6, 'published', 1),
            (v_module3_id, 'Panleucopenia.pdf', 'panleucopenia-pdf', 'pdf_material', false, 7, 'published', 1),
            (v_module3_id, 'Respiratório parte 1 CRF.pdf', 'respiratorio-parte-1-crf-pdf', 'pdf_material', false, 8, 'published', 1),
            (v_module3_id, 'sindrome de pandora.pdf', 'sindrome-de-pandora-pdf', 'pdf_material', false, 9, 'published', 1);
            
    END IF;
END $$;
