# Checklist GitHub e Vercel

O agente deve verificar constantemente a segurança do pipeline, código fonte, variáveis de ambiente e deployments.

## GITHUB
- [ ] `.env`, chaves e credenciais não estão rastreados no Git (verificar diffs).
- [ ] `.gitignore` está corretamente configurado e inclui arquivos de logs e ambientes locais.
- [ ] Histórico do Git não contém segredos (analisar com secret scanner se possível).
- [ ] Gitleaks ou scanner equivalente no CI.
- [ ] Dependabot, SAST ou dependency audit habilitados/recomendados.
- [ ] Branch protection e PR review existem como ação/configuração recomendada.
- [ ] Checks obrigatórios (lint, typecheck, testes, build, security).
- [ ] Permissões mínimas para o `GITHUB_TOKEN` no Actions (`permissions: read-all`, etc).
- [ ] Workflows não dão `echo` ou expõem secrets nos logs de CI.
- [ ] `pull_request_target` NÃO executa código não confiável recebendo secrets.
- [ ] Secrets não são fornecidos a forks.
- [ ] Actions externas (3rd party) são confiáveis e fixadas (pinned by commit hash) de maneira segura.
- [ ] Artefatos de CI não carregam `.env`, banco de dados, chaves SSH ou dados pessoais.
- [ ] `CODEOWNERS` cobre migrations, auth, payments e workflows, exigindo review de pessoas corretas.

## VERCEL
- [ ] Variáveis separadas estritamente entre ambientes: Development, Preview e Production.
- [ ] O ambiente de Preview NUNCA deve usar banco, segredo, keys ou dados de produção (prevenir vazamento por branch de PR).
- [ ] Variáveis expostas no cliente (ex: `NEXT_PUBLIC_`, `VITE_`) NUNCA contêm secrets reais (chaves simétricas, tokens de admin, service_roles).
- [ ] Secrets administrativos e chaves de banco são consumidos SOMENTE no Server (Server Components, Server Actions, Edge Functions, API Routes).
- [ ] Nenhuma string de `service_role` ou chave privada vaza no bundle, no HTML ou no source map público.
- [ ] Rotas privadas (Server-Side) validam sessão E autorização, antes de retornar dados.
- [ ] Respostas com dados de usuários autenticados NÃO usam cache público CDN (`Cache-Control: public` ou revalidação inadequada).
- [ ] Headers de segurança (CSP, HSTS, X-Frame-Options) configurados.
- [ ] Content Security Policy (CSP) é restritiva.
- [ ] Redirects e rewrites não criam Open Redirects.
- [ ] Erros retornados (500, etc) não expõem stack traces, SQL syntax, paths de sistema, ou secrets.
- [ ] Logs no Vercel não contêm tokens (JWTs) ou PII sensível em texto claro.
- [ ] Cron jobs e endpoints internos (background tasks) têm autenticação forte (API Keys secretas) e proteção contra replay.
- [ ] Serverless Functions têm limits, timeouts, rate limits adequados.
- [ ] Domínio e certificados HTTPS estão corretos.
