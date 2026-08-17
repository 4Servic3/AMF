# Checklist Supabase Security

Em qualquer alteração que toque Supabase, o agente deve verificar:

- [ ] Tabelas de schemas expostos (ex: public) possuem RLS.
- [ ] Policies separadas por SELECT, INSERT, UPDATE e DELETE.
- [ ] `USING` restringe as linhas-alvo visíveis (condições de leitura e atualização).
- [ ] `WITH CHECK` restringe o estado novo (condições de inserção e atualização).
- [ ] `auth.uid()` é usado de forma correta e segura.
- [ ] Membership/tenant vem de fonte confiável.
- [ ] `organization_id`/`owner_id` não é confiado quando enviado diretamente pelo cliente.
- [ ] `user_metadata` editável não concede privilégios de negócio ou de administração.
- [ ] `app_metadata`/claims são validados e têm estratégia segura de atualização/revogação.
- [ ] Grants para `anon` / `authenticated` estão mínimos (não usar grants globais permissivos).
- [ ] Views não expõem dados vazados ou contornam isolamento da RLS (usar security invoker views se necessário).
- [ ] RPCs têm EXECUTE restrito a papéis adequados.
- [ ] Funções `SECURITY DEFINER` usam `search_path` seguro (`SET search_path = ''`) e têm privilégio mínimo.
- [ ] Edge Functions autenticam e autorizam usuários (ex: via JWT/header) antes de usar `service_role`.
- [ ] A chave `service_role` nunca aparece em código cliente (frontend/navegador).
- [ ] Storage valida bucket, path, owner/tenant, tipo MIME e tamanho de arquivos de upload.
- [ ] Buckets públicos são realmente intencionais.
- [ ] Realtime respeita a autorização da RLS.
- [ ] Migrations são versionadas, revisáveis e reversíveis.
- [ ] Há índices para colunas utilizadas frequentemente nas policies (para performance e evitar DoS).
- [ ] Testes automatizados cross-user e cross-tenant existem para cada tabela protegida por RLS.

## MATRIZ DE TESTES MÍNIMA:
Para garantir a cobertura da RLS, testar sempre com os seguintes perfis, aplicando SELECT, INSERT, UPDATE, e DELETE:
1. Anônimo
2. Usuário A do tenant A
3. Usuário B do tenant A
4. Usuário C do tenant B
5. Gestor do tenant A
6. Admin autorizado

Testar também tentativas de escalar privilégios (ex: tentar mudar owner_id, organization_id, role, status e campos protegidos num UPDATE).
