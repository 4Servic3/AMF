# Release Checklist de Segurança

Antes de recomendar deploy/release, certifique-se de que os seguintes pontos críticos não estão expostos:

- [ ] Nenhum P0 aberto.
- [ ] Nenhum P1 explorável sem mitigação aprovada.
- [ ] Testes cross-tenant aprovados (sem isolamento quebrado).
- [ ] Nenhum bypass administrativo possível (lógica ou API).
- [ ] Nenhum segredo exposto no cliente ou repositório.
- [ ] RLS ativa e testada para dados privados expostos.
- [ ] Webhooks e pagamentos não são falsificáveis e possuem idempotência/verificação.
- [ ] Build e testes críticos de segurança passando.
- [ ] Preview não está usando bancos/tokens de produção indevidamente.
- [ ] Rollback em caso de falha planejado e documentado.

**RESULTADO DA VERIFICAÇÃO:** APROVADO / BLOQUEADO
