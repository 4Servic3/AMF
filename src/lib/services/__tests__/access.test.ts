import { describe, it, expect } from 'vitest';
import { determineAccessState, type Entitlement } from '../access';

describe('Access Authorization Engine', () => {

  it('deve retornar coming_soon se o produto estiver com status upcoming', () => {
    const state = determineAccessState([], 'prod-1', 'upcoming');
    expect(state).toBe('coming_soon');
  });

  it('deve retornar locked se o usuário não possuir o produto', () => {
    const state = determineAccessState([], 'prod-1', 'active');
    expect(state).toBe('locked');
  });

  it('deve retornar available para curso vitalício sem data de expiração', () => {
    const entitlements: Entitlement[] = [{
      product_id: 'prod-1',
      source_type: 'purchase',
      expires_at: null,
      status: 'active'
    }];
    const state = determineAccessState(entitlements, 'prod-1', 'active');
    expect(state).toBe('available');
  });

  it('deve retornar expired se a assinatura passou da data de expiração', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    const entitlements: Entitlement[] = [{
      product_id: 'prod-2',
      source_type: 'subscription',
      expires_at: pastDate,
      status: 'expired'
    }];
    
    const state = determineAccessState(entitlements, 'prod-2', 'active');
    expect(state).toBe('expired');
  });
});

