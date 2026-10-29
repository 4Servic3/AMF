## Regra principal obrigatoria: contexto pelo mapa AMF

Por determinacao do usuario, em TODA tarefa sobre o aplicativo, consulte primeiro graphify-out/graph.json usando o mapa Graphify. Para economizar tokens, prefira `& ./scratch/graphify-venv/Scripts/python.exe graphify-out/consultar.py TERMOS` antes de procurar contexto no repositorio. Nao reler o projeto inteiro nem o historico inteiro por padrao.
Use os resultados para selecionar apenas os arquivos fonte, trechos de continuidade e testes relevantes. Confirme no codigo os detalhes que sera necessario alterar: o mapa e um indice estrutural, nao prova de comportamento, seguranca ou estado de producao. Se incompleto/desatualizado, registre a limitacao e faca busca pontual; nao invente relacoes. Apos alteracoes funcionais, atualize incrementalmente o mapa e mantenha HTML/Obsidian coerentes, sem reconstrucoes semanticas integrais desnecessarias. Preserve limites de consultas e resultados curtos.
Esta regra vale para analises, correcoes, implementacoes e retomadas. So pode ser dispensada por instrucao explicita posterior do usuario ou indisponibilidade comprovada do mapa, que deve ser informada.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## graphify

Graphify is installed locally. The generated graph is available in graphify-out/; it maps the local working tree.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

### Local Graphify runtime (Windows)
Use `& ./scratch/graphify-venv/Scripts/python.exe -m graphify` in PowerShell in place of the bare `graphify` command. Version: 0.9.65. The isolated environment is ignored by Git. Do not auto-install globally. Only update the graph after code changes when graphify-out/graph.json already exists. The previous app audit remains paused until the user resumes it.

### Consulta economica do mapa
Mapa gerado em graphify-out/graph.json. Para consultas curtas em PowerShell use `& ./scratch/graphify-venv/Scripts/python.exe graphify-out/consultar.py getPlanilhaAccess` (substitua o termo). Este fallback limitado foi necessario porque o comando query padrao ficou lento neste corpus. Verifique depois os arquivos fonte relevantes; o mapa inclui alteracoes locais nao publicadas. Vault Obsidian: graphify-out/obsidian/.
