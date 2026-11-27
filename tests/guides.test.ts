import { describe, it, expect } from 'vitest'
import { catalog } from '../lib/data'
import { getService } from '../lib/services'
import { getGuide, guides } from '../lib/guides'

/** Las guías solo pueden enlazar lo que el visitante puede ver y contratar. */
describe('guías de inspiración', () => {
  it('cada parada enlaza una experiencia visible o un servicio que existe', () => {
    for (const guide of guides) {
      for (const stop of guide.stops) {
        const linked = stop.experienceIds
          ? stop.experienceIds.length > 0 && stop.experienceIds.every((id) => catalog.some((item) => item.id === id))
          : stop.serviceId
            ? getService(stop.serviceId) !== undefined
            : false
        expect(linked, `${guide.slug} → ${stop.title.ES}`).toBe(true)
      }
    }
  })

  it('los slugs son únicos y se encuentran', () => {
    const slugs = guides.map((guide) => guide.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(getGuide(slug)?.slug).toBe(slug)
    expect(getGuide('no-existe')).toBeNull()
  })

  it('todo el texto está en los dos idiomas', () => {
    for (const guide of guides) {
      for (const text of [guide.title, guide.summary, guide.length, guide.intro, guide.tip, guide.image.alt]) {
        expect(text.ES.trim()).not.toBe('')
        expect(text.EN.trim()).not.toBe('')
      }
    }
  })
})
