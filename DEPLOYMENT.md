# Publicação do AMF

- Repositório: `4Servic3/AMF`.
- Branch de produção: `master` (Vercel e acompanhamento local `origin/master`).
- Projeto Vercel: `amf`, equipe `connectwb7-3314s-projects`.
- Site: https://amf-eight.vercel.app

## Fluxo

1. Revisar as alterações e executar `npm test` e `npm run build`.
2. Criar o commit na branch correta. Enviar com `git push origin master`.
3. Aguardar a implantação automática terminar com `Ready` e ambiente `Production`.
4. Conferir que o hash em `Source` é exatamente o de `git rev-parse HEAD`.
5. Testar a funcionalidade no domínio principal após atualizar a página.

`Redeploy` de uma implantação antiga reconstrói aquele commit; não busca automaticamente o último commit de outra branch. Não usá-lo para publicar alterações novas.

`admin-panel-init` e outras branches históricas não são mais a origem de produção. Branches de desenvolvimento geram previews; integrar alterações revisadas em `master` para publicá-las.

## Cursos e vídeos

Em `/admin/courses`, abrir **Novo curso**, salvar as informações, enviar a capa (JPG/PNG/WebP até 3 MB) e adicionar módulo e aula. Em **Gerenciar vídeo**, enviar o arquivo ou selecionar um vídeo da biblioteca. Aguardar o processamento e confirmar **Usar este vídeo na aula**. **Publicar curso e aulas** valida e libera todos os módulos e aulas não arquivados em uma transação. Cursos publicados continuam editáveis; **Publicar novas aulas** libera novas aulas salvas.

**Agendar** usa data e hora de Brasília. O job `amf-course-publication` do Supabase Cron verifica agendamentos a cada minuto. O curso permanece em rascunho até a execução, que repete a validação dos vídeos. Falhas são registradas em `publication_schedules.last_error` e exibidas no editor. É possível cancelar o agendamento. A migração `20260909000000_course_publication.sql` instala as funções e o job; não há endpoint público de cron.

O arquivo é transferido diretamente ao endereço regional fornecido pela Mux. A Vercel atende apenas a autorização e o registro do envio, sem transportar o arquivo de vídeo. A política `connect-src` permite os destinos HTTPS da Mux. A reprodução continua exigindo tokens assinados e autorização do aluno.

Para diagnóstico, `node scripts/video-audit.mjs` usa as variáveis locais, faz leituras e mostra estados e origens, sem imprimir chaves nem URLs assinadas de upload.
