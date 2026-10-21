import { describe, expect, it } from 'vitest'
import { checkoutLink, formatPrice, gatewayBackHref, gatewayHref, parseGatewayParams } from '@/lib/commerce/gateway'

describe('gateway addresses', () => {
  it('builds one purchase address per product or course', () => {
    expect(gatewayHref({ kind: 'product', slug: 'casos-clinicos' }, 'casos')).toBe('/app/gateway?produto=casos-clinicos&origem=casos')
    expect(gatewayHref({ kind: 'course', slug: 'imersao-clinica-de-felinos-parte-1' }, 'cursos')).toBe('/app/gateway?curso=imersao-clinica-de-felinos-parte-1&origem=cursos')
  })

  it('round-trips its own addresses', () => {
    expect(parseGatewayParams({ produto: 'planilha-doses-seguras-felinos', origem: 'planilha' })).toEqual({ target: { kind: 'product', slug: 'planilha-doses-seguras-felinos' }, origin: 'planilha' })
  })

  it('ignores unsafe slugs and unknown origins', () => {
    expect(parseGatewayParams({ produto: '../admin', origem: 'https://evil.com' })).toEqual({ target: null, origin: 'home' })
    expect(parseGatewayParams({ curso: 'Curso Com Espaço' }).target).toBeNull()
  })

  it('sends the member back to where the purchase started', () => {
    expect(gatewayBackHref('casos')).toBe('/app/casos')
    expect(gatewayBackHref('cursos')).toBe('/app/cursos')
    expect(gatewayBackHref('home')).toBe('/app')
  })
})

describe('checkout link', () => {
  it('accepts only https checkout pages', () => {
    expect(checkoutLink('http://pay.example.com/x')).toBeNull()
    expect(checkoutLink('javascript:alert(1)')).toBeNull()
    expect(checkoutLink('not a url')).toBeNull()
    expect(checkoutLink(null)).toBeNull()
  })

  it('pre-fills the member e-mail without overriding a provider value', () => {
    expect(checkoutLink('https://pay.example.com/checkout/abc', 'aluna@exemplo.com')).toBe('https://pay.example.com/checkout/abc?email=aluna%40exemplo.com')
    expect(checkoutLink('https://pay.example.com/c?email=fixo%40x.com', 'aluna@exemplo.com')).toBe('https://pay.example.com/c?email=fixo%40x.com')
  })
})

describe('price label', () => {
  it('formats reais with the billing period', () => {
    expect(formatPrice(19790, null)?.replace(/\s/g, ' ')).toBe('R$ 197,90')
    expect(formatPrice(4990, 'month')?.replace(/\s/g, ' ')).toBe('R$ 49,90 por mês')
  })
  it('hides missing or invalid prices', () => {
    expect(formatPrice(0, null)).toBeNull()
    expect(formatPrice(undefined, null)).toBeNull()
  })
})
