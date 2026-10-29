import { describe, expect, it } from 'vitest'
import { centsToPrice, parseNewProductForm, parseProductForm, priceToCents, slugify } from '@/lib/product-settings-schema'

function form(values: Record<string, string>) {
  const data = new FormData()
  Object.entries({ id: 'f6748b06-8efa-4dc6-a28f-96a17d14b7fd', name: 'Doses Seguras', status: 'active', ...values }).forEach(([k, v]) => data.set(k, v))
  return data
}

describe('product settings form', () => {
  it('accepts an https checkout, a price and the cases rule', () => {
    const result = parseProductForm(form({ checkoutUrl: 'https://pay.hotmart.com/X1', price: '197,90', interval: 'month', unlocksCases: 'on' }))
    expect(result.success && result.data).toMatchObject({ checkoutUrl: 'https://pay.hotmart.com/X1', price: '197,90', interval: 'month', unlocksCases: true })
  })
  it('rejects a non-https checkout', () => {
    const result = parseProductForm(form({ checkoutUrl: 'http://pay.example.com' }))
    expect(result.success).toBe(false)
  })
  it('rejects an invalid price', () => {
    expect(parseProductForm(form({ price: 'R$ 10' })).success).toBe(false)
  })
  it('converts prices without floating point errors', () => {
    expect(priceToCents('197,9')).toBe(19790)
    expect(priceToCents('0,1')).toBe(10)
    expect(priceToCents('49.90')).toBe(4990)
    expect(priceToCents('')).toBeNull()
    expect(centsToPrice(19790)).toBe('197,90')
    expect(centsToPrice(null)).toBe('')
  })
})

describe('new product form', () => {
  it('turns a Portuguese name into a URL slug', () => {
    expect(slugify('Planilha Doses Seguras — Felinos')).toBe('planilha-doses-seguras-felinos')
    expect(slugify('  Ação & Reação!  ')).toBe('acao-reacao')
  })

  it('accepts only types that are sold outside a course', () => {
    const form = new FormData()
    form.set('name', 'Mentoria AMF'); form.set('type', 'event'); form.set('status', 'draft')
    expect(parseNewProductForm(form).success).toBe(true)
    form.set('type', 'course')
    expect(parseNewProductForm(form).success).toBe(false)
  })
})
