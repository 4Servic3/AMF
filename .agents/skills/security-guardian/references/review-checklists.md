# Checklists Adicionais de Revisão (Input, XSS, Upload, Autenticação)

## INPUT / OUTPUT
- [ ] Schema de validação obrigatório no lado do servidor (Zod, Joi, etc).
- [ ] Validar: tipo, tamanho, range, formato, enum, allowlist.
- [ ] Rejeição estrita de campos desconhecidos (strip/strict).
- [ ] Output encoding contextual aplicado ao renderizar texto.
- [ ] NENHUM uso de `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `Function` com input de usuário (se não for absoluto sanitizado no servidor).
- [ ] Sanitização rigorosa de Markdown/HTML/Rich text (DOMPurify).
- [ ] Validar Redirects (evitar Open Redirect e redirecionar apenas para domínios na allowlist ou paths relativos).
- [ ] Nenhuma injeção CSV em relatórios (caracteres `+`, `-`, `=`, `@` no início dos campos de texto).
- [ ] Prevenção de Injeção SQL ou manipulação de RPC (sempre usar queries parametrizadas).
- [ ] Defesa SSRF (Server-Side Request Forgery) e Path Traversal ao lidar com URLs ou nomes de arquivos.

## UPLOADS
- [ ] Allowlist restrita de extensões permitidas e MIME types válidos.
- [ ] Verificação de Magic Bytes para assegurar que a extensão condiz com o arquivo.
- [ ] Limite rígido de tamanho do arquivo e quantidade (rate limit por usuário/minuto).
- [ ] Nome do arquivo sempre gerado ou hasheado pelo servidor (nunca confiar no nome enviado pelo cliente).
- [ ] Reprocessamento de imagens para remover metadados e validar formatação (ex: resize seguro).
- [ ] SVG e HTML totalmente bloqueados para upload de usuário, a menos que sejam estritamente necessários e filtrados.
- [ ] Armazenamento (bucket) isolado do domínio principal da aplicação e que não executa os scripts no navegador de outro usuário.
- [ ] Resposta com header `Content-Disposition: attachment` e `X-Content-Type-Options: nosniff`.
- [ ] Paths no storage isolados (ex: `tenant_id/user_id/nome_gerado.jpg`).
- [ ] Cuidado com arquivos comprimidos e zip/decompression bombs (limites de extração).

## SESSÃO E AUTENTICAÇÃO
- [ ] Cookies setados como `Secure`, `HttpOnly` e `SameSite=Lax` ou `Strict` onde aplicável.
- [ ] Prevenção de CSRF, especialmente para rotas mutating que usam autenticação por cookie.
- [ ] Expiração de token/sessão adequada.
- [ ] Capacidade de invalidar e revogar a sessão (Logout e troca de senha invalidam os tokens antigos).
- [ ] Segurança de fluxo de recuperação de senha (tokens temporários, link único).
- [ ] Prevenção de enumeração de contas (resposta idêntica para email válido/inválido em login/recovery).
- [ ] Limite de força bruta ativado (Lockout ou CAPTCHA após falhas).
- [ ] MFA exigido para roles administrativos.
- [ ] Fluxo OAuth/OIDC usa verificação `state`, `nonce` e/ou PKCE. Validação de Issuer e Audience e Redirect URI estrito.
- [ ] NENHUMA permissão sensível confiada diretamente em localStorage para decisão lógica.

## API E ABUSO
- [ ] BOLA/BFLA/BOPLA analisados e prevenidos (verificação de ownership).
- [ ] Paginação estrita e limites de payload (`MAX_LIMIT`).
- [ ] Rate limits aplicados por Risco, Conta, Tenant, e Rota.
- [ ] Proteção de cotas financeiras/recursos: IA, envios de E-mail, exportações pesadas, buscas caras.
- [ ] CORS configurado exatamente para a allowlist de origens conhecidas.
- [ ] Timeout rigoroso configurado em funções para consumo excessivo de recursos/DoS.
- [ ] Logs mantidos em 401, 403, 429 para gerar alertas contra enumeração/ataque.
