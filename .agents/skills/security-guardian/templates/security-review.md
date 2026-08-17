# Modelo de Revisão de Segurança (Modos A e B)

**OBJETIVO:** Revisão defensiva do diff/PR ou feature em desenvolvimento.
**ESCOPO AUTORIZADO:**

## 1. Descoberta de Contexto e Ameaças
- Framework, tabelas, policies, atores envolvidos
- Dados sensíveis e limites de confiança

## 2. Checklists Validadas
- [ ] Supabase RLS / Autenticação
- [ ] Lógica de Negócio / Isolamento
- [ ] Input, Output, Upload e APIs
- [ ] Segredos, GitHub e Vercel (se aplicável)

## 3. Achados
(Insira os achados usando o modelo `security-finding.md`)

## 4. Conclusão / Decisão
**DECISÃO DE RELEASE:** APROVADO / APROVADO COM RISCO ACEITO / BLOQUEADO POR SEGURANÇA
**MOTIVO:** (Justificar o bloqueio se houver P0, P1 explorável, cross-tenant leak, etc.)
**AÇÕES MANUAIS PENDENTES:**
