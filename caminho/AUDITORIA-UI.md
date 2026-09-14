# Auditoria e sistema visual AMF — 14/09/2026

## Escopo e evidência
Auditoria do código das telas home, catálogo, detalhes, currículo, aula e perfil/configurações; capturas anteriores do usuário para Stories. Não houve inspeção autenticada de todas as telas no navegador nesta etapa.

## Achados
- Headers: PremiumPageHeader, catálogo e perfil implementam espaçamentos, marcas e tamanhos distintos.
- Cards: raios de 12–28px, bordas e sombras repetidas e diferentes; falta uma definição compartilhada de superfície.
- Hierarquia: títulos editoriais, rótulos em caixa alta e textos de 10–11px competem; nomes de cursos são truncados cedo.
- Home: banner tem largura calculada além dos gutters existentes; academia tem decoração redundante e sombras diferentes.
- Catálogo: cards de largura total também em telas grandes; filtros e abas têm densidades diferentes.
- Curso/currículo: boas divisões funcionais, mas listas, cabeçalhos de módulo e ações precisam de acabamento uniforme.
- Aula: margens negativas e altura de 100vh com overflow oculto não correspondem ao wrapper atual; risco de recorte mobile. Player e autorização devem ficar intactos.
- Perfil: agrupamento já adequado; padronizar superfícies, separadores, campos e hierarquia dos headers.

## Direção aprovada pelo pedido
Inspiração em interfaces nativas iPhone/iPad, conservando AMF: marfim, ameixa, petróleo e dourado. Fonte nativa do sistema dentro da área de membros; monograma editorial preservado. Nenhuma fonte externa nova.

## Contrato visual
Escala de espaço 4/8/12/16/24/32; gutters 20–32px; superfícies brancas, bordas discretas, raio 24px (cards), 16px (controles), sombras leves. Títulos com tracking levemente negativo e semibold; rótulos menores com bom contraste. Alvos principais de toque de 44px. Foco visível e movimento reduzido. Grades adaptativas sem alterar ordem ou conteúdo.

Classes compartilhadas em member-ui.css, escopadas em amf-member-ui; admin fora do escopo. Classes semânticas: amf-widget, amf-list-row, amf-page-heading, amf-section-heading, amf-member-header, amf-field, amf-action, amf-course-grid, amf-lesson-shell.

## Preservação e validação
Manter consultas, condições de acesso, handlers, hrefs, progresso, pagamentos, upload, reprodução e banco. Stories mantêm capa 96px e somente nome. Conferir diff funcional, TypeScript, testes existentes, build e amostras responsivas. Confirmar visual real autenticado após publicação; não confundir compilação com teste de navegação.

## Validacao realizada
121 testes, build e TypeScript aprovados. Seis telas revistas em previews com dados ficticios; catalogo tambem em tablet 1024px e perfil em 320px. Ajustados contrastes do perfil e certificado. Fluxo autenticado e reproducao real permanecem para conferencia apos publicacao. Publicacao bloqueada pela revisao automatica; aguarda autorizacao especifica.
