import { describe, expect, it } from 'vitest'
import { PLANILHA_SLIDE, bannerInPeriod, buildHomeSlides, sanitizePreviewSlides } from '@/lib/home-banner-slides'

describe('buildHomeSlides', () => {
  it('usa a imagem padrão sem banners e sempre termina na Planilha', () => {
    const slides = buildHomeSlides([])
    expect(slides.map(s => s.id)).toEqual(['welcome', PLANILHA_SLIDE.id])
  })
  it('monta imagem e link do curso de cada banner', () => {
    const [slide] = buildHomeSlides([{ id: 'b1', media_asset_id: 'm1', cta_target_type: 'course', cta_target_id: 'imersao', title: 'Imersão' }])
    expect(slide).toMatchObject({ id: 'b1', imageUrl: '/api/media/m1', href: '/app/cursos/imersao', alt: 'Imersão' })
  })
})

describe('bannerInPeriod', () => {
  const now = Date.parse('2026-11-10T12:00:00-03:00')
  it('sem datas é permanente', () => expect(bannerInPeriod('', '', now)).toBe(true))
  it('respeita início e fim no horário de Brasília', () => {
    expect(bannerInPeriod('2026-11-11', '', now)).toBe(false)
    expect(bannerInPeriod('2026-11-10', '2026-11-10', now)).toBe(true)
    expect(bannerInPeriod('', '2026-11-09', now)).toBe(false)
  })
})

describe('sanitizePreviewSlides', () => {
  const origin = 'https://amf.test'
  it('aceita só imagens e links do próprio app', () => {
    const slides = sanitizePreviewSlides([
      { id: 'a', imageUrl: '/api/media/1', href: '/app/cursos/x', alt: 'A' },
      { id: 'b', imageUrl: `blob:${origin}/abc`, href: 'https://evil.test', alt: 'B' },
      { id: 'c', imageUrl: 'https://evil.test/x.png', alt: 'C' },
      { id: 'd', imageUrl: '//evil.test/x.png', alt: 'D' },
    ], origin)
    expect(slides?.map(s => s.id)).toEqual(['a', 'b'])
    expect(slides?.[1].href).toBeUndefined()
  })
  it('ignora mensagens que não são lista', () => expect(sanitizePreviewSlides({}, origin)).toBeNull())
})
