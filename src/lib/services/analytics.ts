export function trackEvent(eventName: string, payload: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  // Para a Etapa 2, o registro será via mock ou console para evitar falhas de RLS.
  // Futuramente isso enviará para a rota /api/analytics
  console.log(`[Analytics] ${eventName}`, payload);
}
