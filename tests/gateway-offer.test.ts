import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ rows: {} as Record<string, unknown>, rpc: vi.fn(), user: vi.fn() }))
function chain(table: string) {
  const query: Record<string, unknown> = {}
  for (const method of ['select', 'eq']) query[method] = () => query
  query.maybeSingle = async () => ({ data: mocks.rows[table] ?? null, error: null })
  return query
}
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.user }, rpc: mocks.rpc, from: chain }) }))

import { loadGatewayOffer } from '@/lib/commerce/offer'

const casos = { id: '7926e829-a202-4e6d-a4fd-8657e10d4405', name: 'Casos Clínicos AMF', description: 'Acesso completo', type: 'subscription', slug: 'casos-clinicos', status: 'active', checkout_url: 'https://pay.example.com/casos', product_prices: [{ amount: 4990, interval: 'month', active: true }] }

describe('gateway offer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.rows = {}
    mocks.user.mockResolvedValue({ data: { user: { id: 'member', email: 'aluna@exemplo.com' } }, error: null })
    mocks.rpc.mockResolvedValue({ data: { courses: [], products: [], cases: false }, error: null })
  })

  it('offers the checkout with the member e-mail to whoever does not own the product', async () => {
    mocks.rows.products = casos
    const offer = await loadGatewayOffer({ kind: 'product', slug: 'casos-clinicos' })
    expect(offer).toMatchObject({ name: 'Casos Clínicos AMF', owned: false, checkoutUrl: 'https://pay.example.com/casos?email=aluna%40exemplo.com', accessHref: '/app/casos' })
    expect(offer?.price?.replace(/\s/g, ' ')).toBe('R$ 49,90 por mês')
  })

  it('sends owners straight to the content instead of charging again', async () => {
    mocks.rows.products = casos
    mocks.rpc.mockResolvedValue({ data: { courses: [], products: [], cases: true }, error: null })
    expect(await loadGatewayOffer({ kind: 'product', slug: 'casos-clinicos' })).toMatchObject({ owned: true, checkoutUrl: null, accessHref: '/app/casos' })
  })

  it('returns nothing for a product that is not on sale', async () => {
    expect(await loadGatewayOffer({ kind: 'product', slug: 'nao-existe' })).toBeNull()
  })

  it('shows a course without linked product, sending to the placeholder checkout', async () => {
    mocks.rows.courses = { id: '918c176f-8d14-43a9-89e9-67aa43820a9d', slug: 'imersao', title: 'Imersão', short_description: null, product_id: null }
    expect(await loadGatewayOffer({ kind: 'course', slug: 'imersao' })).toMatchObject({ name: 'Imersão', owned: false, checkoutUrl: '/checkout', accessHref: '/app/cursos/imersao' })
  })
})
