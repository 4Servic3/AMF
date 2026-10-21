import { describe, expect, it } from 'vitest'
import { describeAccess, encodeAccessTarget, parseAccessTarget } from '@/lib/admin-access-target'

const course = { id: '918c176f-8d14-43a9-89e9-67aa43820a9d', title: 'Imersão Clínica de Felinos — Parte 1' }
const product = { id: 'f6748b06-8efa-4dc6-a28f-96a17d14b7fd', name: 'Doses Seguras para Felinos' }

describe('admin access target', () => {
  it('round-trips the select value', () => {
    expect(parseAccessTarget(encodeAccessTarget({ kind: 'product', id: product.id }))).toEqual({ kind: 'product', id: product.id })
  })
  it.each(['', 'course', 'path:' + course.id, 'course:not-a-uuid', 'product:' + product.id + ':x'])('rejects %s', (value) => {
    expect(parseAccessTarget(value)).toBeNull()
  })
  it('names courses and products instead of showing raw ids', () => {
    expect(describeAccess({ resource_type: 'course', resource_id: course.id }, [course], [product])).toBe('Curso · Imersão Clínica de Felinos — Parte 1')
    expect(describeAccess({ resource_type: 'product', resource_id: product.id }, [course], [product])).toBe('Produto · Doses Seguras para Felinos')
    expect(describeAccess({ resource_type: 'product', resource_id: course.id }, [course], [product])).toBe('Produto removido ou indisponível')
  })
})
