export type AccessState = 'locked' | 'preview' | 'available' | 'expired' | 'coming_soon';
export type Entitlement = {
  product_id: string;
  source_type: 'purchase' | 'subscription' | 'manual';
  expires_at: Date | null;
  status: 'active' | 'expired';
};

/**
 * Motor central de autorização da Academia.
 */
export async function getUserEntitlements(userId: string): Promise<Entitlement[]> {
  // Simulação para o motor de acesso. Em produção, buscará da tabela `entitlements`.
  if (!userId) return [];
  return [];
}

export function determineAccessState(entitlements: Entitlement[], productId: string, productStatus: string = 'active'): AccessState {
  if (productStatus === 'upcoming') {
    return 'coming_soon';
  }

  const entitlement = entitlements.find(e => e.product_id === productId);

  if (!entitlement) {
    return 'locked';
  }

  if (entitlement.expires_at && new Date() > entitlement.expires_at) {
    return 'expired';
  }

  return 'available';
}

export async function canAccessProduct(userId: string, productId: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId);
  const state = determineAccessState(entitlements, productId);
  return state === 'available';
}

