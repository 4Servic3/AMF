type Conversation = { ticket: { id: string }; messages: { id: string; own: boolean }[] } | null;

/**
 * Estado do botão de suporte. A chave muda a cada mensagem nova, então
 * "ocultar" e "já vi" valem só até a próxima mensagem.
 */
export function bubbleState(data: Conversation, marks: { dismissed: string; seen: string }) {
  if (!data) return { key: '', visible: false, unread: false };
  const last = data.messages.at(-1);
  const key = `${data.ticket.id}:${last?.id || ''}`;
  return { key, visible: marks.dismissed !== key, unread: !!last && !last.own && marks.seen !== key };
}
