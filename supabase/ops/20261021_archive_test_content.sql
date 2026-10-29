-- Etapa 0: retira conteúdo de teste da área do aluno. Reversível: apenas muda status para 'archived'.
-- Nada é apagado; para restaurar, volte o status para 'published' ou 'draft'.
BEGIN;
UPDATE courses SET status = 'archived', archived_at = now()
 WHERE id IN ('894b4e2d-2ca8-4140-9862-560919e15b7c',  -- Validação técnica de vídeo — não publicar
              '069f199d-8913-4cbf-9462-75a0cf2e2d9c',  -- 02
              '12326d28-38f6-4312-8261-9c912db81bb7')  -- Imersão Clínica Felina — Parte 1 (rascunho duplicado)
   AND status <> 'archived';
UPDATE cases SET status = 'archived'
 WHERE id IN ('269a9557-27fe-4a9a-ac8c-3f909f75720e','cd29ee26-89bb-43ac-aa6a-25457d83d301','856fd25a-c7e8-41a5-b509-b5c05aaab57e',
              '50343cca-ae19-4a1b-bf4c-b7eb14d525d3','19514182-bb65-41c0-814f-081120ac93c4','ec5dd00f-0b00-4a72-849f-40e458c36949',
              'e59128dc-910e-4c4a-a98e-f5972e79865d','60f73314-348a-47ae-bbf1-17f09e933fb7','bfc5443b-d84f-4a5f-b7f9-6a776d09c381',
              '3a1e2876-12d2-441b-894f-9862eb2507ae','4108d78d-ca2d-454b-b7a3-4c5a632ccfc8','dd8fe0ed-c452-4633-b86a-b5f00b5bfa61',
              '6b647555-dc09-4b86-80bc-a23f4b5463f7')
   AND status <> 'archived';
COMMIT;
