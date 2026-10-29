# Relatório AMF — 21/09/2026

## Resultado principal
A integração da Planilha de Doses Seguras está commitada localmente, mas ainda não está na master do GitHub nem publicada na Vercel. Não foi encontrado erro de build atual. O trabalho foi preservado; nesta auditoria não houve push, merge, deploy, mudança de código funcional ou concessão de acesso.

## GitHub, Antigravity e produção
- Repositório local: C:\Users\Administrador\Desktop\Area de trabalho\Cabeçadegelo\AMF\AMF. O caminho cadastrado no Codex (Desktop\AMF) continua antigo.
- Executado fetch de origin usando URL pública temporária, sem mostrar a credencial da configuração. Nenhuma atualização remota nova para incorporar.
- HEAD local: 59d45cc1562686e288040a5bde31b31ce80297c5. Master remota: b3e8610d86e8a1ddd60a52e8a2e6aa76018f4806. Local está um commit à frente; nenhuma divergência de conteúdo remoto a resolver.
- Reflog: em 18/09 foi criado b27b382 e depois emendado para 59d45cc. Entre esses dois commits houve somente dez linhas adicionadas em CONTINUIDADE.txt; nenhuma mudança funcional na emenda.
- Commit final reúne 27 arquivos, 1.423 inserções e 18 remoções: integração da planilha preparada na sessão anterior, carrossel, rotas, acesso, testes, script de provisionamento e continuidade. Não é evidência de que o Antigravity reescreveu todos esses arquivos.
- Nenhuma branch remota contém 59d45cc; consulta do commit no GitHub retornou HTTP422 e não existem deployments associados. O endpoint de status respondeu pending com zero verificações: isso NÃO significa que exista um build em andamento.
- Não há log suficiente nesta auditoria para afirmar o motivo exato do push não concluído (autenticação/rede/permissão etc.). Commit local bem-sucedido e ausência de publicação são fatos confirmados.
- Master remota b3e8610 tem Vercel SUCCESS: https://vercel.com/connectwb7-3314s-projects/amf/6iekJXfMwQuCJKgQLtswbJ9QMymv . Site: https://amf-eight.vercel.app . HTTP200 na raiz, /entrar e /admin/login; HTTP404 no banner novo e na API de download da planilha.

## O que estávamos fazendo
Pedido: integrar o app web fornecido em Produtos\Planilha de doses seguras para felinos\Planilha Web, adicionar o banner em carrossel junto ao existente e permitir XLSX somente a compradores com acesso.

Implementado no commit local:
- Carrossel preserva banners administrativos/fallback e inclui a planilha; swipe, controles, pausa e respeito a movimento reduzido.
- Componentes React da calculadora em src/components/planilha-felinos, CSS Module isolado e utilitários de cálculo/busca preservados. Sem copiar PWA/service worker ou modificar o tema global.
- Página /app/produtos/planilha-doses-seguras-felinos e calculadora em /calculadora; rota estática isolada dos produtos legados simulados.
- Autorização por auth.getUser, produto ativo e entitlement específico vigente. Curso, papel admin ou simples login não liberam o produto.
- /api/products/planilha-doses-seguras-felinos/download repete autorização e entrega XLSX como attachment com no-store. Dados clínicos só chegam ao comprador após autorização no servidor, não por import em JavaScript público.
- 34 testes novos: 19 acesso, 10 cálculo/busca e 5 download.

## Supabase conferido novamente, somente leitura
Produto f6748b06-8efa-4dc6-a28f-96a17d14b7fd existente, bundle/active. Bucket amf_product_files privado. Objetos planilha-felinos/v13/Doses_Seguras_Felinos_v13_Polyana.xlsx (69.079 bytes) e planilha-felinos/v13/data.json (150.148 bytes) presentes.
XLSX SHA256 a1583dbb92b8990feca7dbb954c515b4661ccee53451c5880cac0aaa32eb781b, igual ao original conferido na sessão anterior. JSON SHA256 2b38c1ce17efc7f0417a66acd696f0d6f45ac00f08fa81cb02ad295572f75001. Nenhum arquivo clínico foi encontrado versionado em src/public; cópia temporária fica em scratch ignorado.
ZERO entitlements de produto com status active. PLANILHA_CHECKOUT_URL ausente no ambiente local; não foi consultada a configuração de variáveis da Vercel.

## Verificação atual
- npx vitest run tests: 169 testes em 25 arquivos aprovados.
- npm run typecheck: aprovado.
- npm run build: aprovado; rotas novas presentes. A geração reportou 50/50 páginas, além da listagem de rotas dinâmicas; não equiparar esse número ao total de rotas.
- Aviso não bloqueante: package-lock na pasta do usuário ignorado por estar fora do repositório.
- git diff --check HEAD~1 HEAD apontou somente linhas vazias extras no fim de cinco componentes; não é erro de execução.
- Testes automatizados/build não comprovam funcionamento autenticado no navegador, câmera física ou execução clínica. Essa validação da nova planilha ainda não foi realizada.

## Pendências concretas
1. Implementar concessão/revogação administrativa específica da planilha. /admin/access/planilha e ação correspondente NÃO existem. A tentativa anterior não chegou a gravar arquivos; admin atual concede cursos.
2. Definir venda/liberação de compradores. Pergunta sobre checkout/provedor e compradores existentes continua sem resposta. Webhook de pagamento atual retorna503 por integração não configurada; não libera compras automaticamente.
3. Testar com contas temporárias reais: comprador/sem acesso/expirado/revogado; calculadora, busca, peso, download/hash, privacidade do Storage e mobile/desktop. Não alterar contas reais para teste.
4. Concluir revisão e publicar o commit correto em master; verificar Vercel e funcionamento pós-deploy. Não refazer provisionamento nem publicar um commit antigo por redeploy.
5. Material fornecido: CONTEXTO_DO_PROJETO original informa correções no JSON não espelhadas no XLSX (KI, Tansulosina, Meloxicam, Citrato). Preservar ambos e não rodar build-data nem inventar doses; alinhamento clínico depende da responsável.

## Estado das demais áreas
Produção já contém as entregas anteriores de cursos/vídeos, Stories verticais/48h, interface de membros e painel administrativo. Este commit não muda regras de cursos, Stories, pagamentos nem esquema do banco; a alteração funcional em arquivo anterior fica nos banners da home.
Persistem limitações anteriores confirmadas no código: Academia do aluno com etapas/progresso fixos, notificações exemplificativas (inclusive pagamento), suporte do aluno sem abertura de chamado, catálogo genérico de produtos simulado, campanhas administrativas só em rascunho e processamento de filas sem comprovação operacional. Esses pontos não devem ser anunciados como concluídos.

## Retomada segura
Preservar atalho CONTINUIDADE - Atalho.lnk, scratch, .env e originais externos. Nunca imprimir remoto com credencial. Antes desta auditoria a árvore estava limpa, exceto o atalho não rastreado. Este relatório e o adendo na continuidade ficam locais; nenhum commit de documentação foi criado nesta auditoria.
