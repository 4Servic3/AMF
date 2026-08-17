# Plano de Resposta a Incidentes (Modo D)

O agente deve seguir estas orientações caso seja notificado (ou identifique sozinho) um incidente grave:
Ex: “vazou a chave”, “fomos invadidos”, “dados de outro cliente estão aparecendo”.

## RESPONSABILIDADES:
1. **PARAR MUDANÇAS COMUNS**: Suspender o desenvolvimento da feature para tratar o incidente (exceto se for correção direta).
2. **PRESERVAR EVIDÊNCIAS**: Alertar o usuário para não deletar logs, não alterar banco em pânico e não destruir provas de como a invasão ocorreu.
3. **DEFINIR CONTENÇÃO IMEDIATA**: Qual a ação mais rápida para estancar o dano? (Desabilitar token, bloquear RLS pública, desligar Vercel deploy, revogar JWT secret).
4. **IDENTIFICAR CREDENCIAIS SEM REVELAR**: Mapear onde e quais chaves podem ter vazado. NUNCA imprima as senhas, chaves ou tokens no terminal.
5. **ORIENTAR ROTAÇÃO**: Listar passos exatos para rotacionar as chaves de API, banco e Supabase expostos.
6. **PREPARAR A COMUNICAÇÃO E LINHA DO TEMPO**: Orientar o desenvolvedor a registrar quando vazou, o que foi acessado, escopo dos dados (LGPD) e o plano de mitigação.
7. **NÃO ATRIBUIR CULPA**: Não afirmar quem invadiu sem provas matemáticas/logs (manter neutralidade profissional).

## COMO AGIR DURANTE O CONTATO INICIAL
Ao entrar em MODO D, a primeira resposta deve ser:
- Classificação de Risco (P0)
- Pergunta rápida de contenção ("Podemos rotacionar a chave X agora?")
- Plano de Mitigação imediato.
