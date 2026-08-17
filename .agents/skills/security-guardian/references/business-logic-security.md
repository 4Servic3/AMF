# Checklist de Lógica de Negócio e API

O agente deve impedir que o cliente determine DIRETAMENTE e SEM VALIDAÇÃO DO SERVIDOR os seguintes atributos:

- role, isAdmin ou permissões;
- organization_id, tenant_id, owner_id ou user_id de destino (a menos que seja uma transferência autorizada e validada);
- preço, desconto, moeda, imposto ou total;
- plano, trial, assinatura ou expiração;
- paid, approved, refunded, verified ou status equivalente;
- saldo, limite, crédito, pontos ou cotas;
- desbloqueio de conteúdo (paywall/gatilho);
- escopo de relatórios e exportações;
- resultado de conciliação ou aprovação de webhook.

## Para Entidades Críticas, documentar e revisar:
- Estados permitidos e transições válidas (State Machine segura).
- Ator autorizado (quem pode invocar a transição?).
- Pré-condições.
- Fonte de verdade (banco de dados/provedor confiável).
- Transação/constraint (prevenir race conditions/duplicações).
- Idempotência (para retentativas e concorrência).
- Efeitos colaterais (envio de emails, deleção em cascata).
- Auditoria (logs do evento).
- Rollback/compensação.

## Testar ativamente no código e lógicas:
- BOLA/IDOR: Enviar IDs válidos mas pertencentes a outro usuário/tenant na API.
- Mass assignment: Enviar campos extras no JSON (ex: `{"role":"admin"}`).
- Replay e duplicidade (duplo clique, chamadas em loop).
- Requisições concorrentes (race conditions para gastar o mesmo saldo 2 vezes).
- Fluxo fora de ordem (pular etapas do checkout).
- Cupom/trial reutilizado.
- Exportação ou busca sem limite de escopo de tenant.
- Bypass por endpoint antigo, RPC, view sem RLS, ou server action que esqueceu de validar a sessão.
- Autorização apenas visual no front-end (esconder o botão, mas a rota da API funcionar).

## Pagamentos e Webhooks
- O checkout/gateway oficial deve ser a única fonte de verdade de pagamentos.
- Preço/produto carregados apenas no servidor.
- Assinatura do webhook validada com método oficial usando raw body.
- Environment, account, event, order, amount e currency devem ser verificados e compatíveis.
- Idempotency key (event ID único gravado).
- Proteção contra replay.
- Refund/chargeback alteram/reduzem acesso corretamente.
- Transação no DB evita aprovação duplicada/race conditions.
