import { describe, it, expect } from 'vitest'
import { catalog as experiences, experiences as allExperiences, isBookableOnline } from '../lib/data'
import { applyRefinements, emptyRefinements, sortExperiences } from '../lib/catalog-filters'
import { destinationPages, destinationIdByName } from '../lib/destination-details'
import { experienceDetails } from '../lib/experience-details'

/** Filtros del catálogo, orden y páginas de destino. Sin base de datos. */

describe('filtros del catálogo', () => {
  it('sin filtros devuelve todo', () => {
    expect(applyRefinements(experiences, emptyRefinements)).toHaveLength(experiences.length)
  })

  it('medio día y día completo se reparten el catálogo sin solaparse', () => {
    const half = applyRefinements(experiences, { ...emptyRefinements, duration: 'half' })
    const full = applyRefinements(experiences, { ...emptyRefinements, duration: 'full' })
    expect(half.length + full.length).toBe(experiences.length)
    expect(half.every((item) => item.durationHours <= 5)).toBe(true)
  })

  it('precio máximo, familias y dificultad', () => {
    expect(applyRefinements(experiences, { ...emptyRefinements, maxPrice: 30 }).every((item) => item.priceUsd !== null && item.priceUsd <= 30)).toBe(true)
    const family = applyRefinements(experiences, { ...emptyRefinements, family: true })
    expect(family.map((item) => item.id)).not.toContain('volcan-izalco')
    const easy = applyRefinements(experiences, { ...emptyRefinements, easy: true })
    expect(easy.every((item) => experienceDetails[item.id]?.difficulty === 'easy')).toBe(true)
  })
})

describe('orden', () => {
  it('por precio, sin modificar la lista original', () => {
    const before = experiences.map((item) => item.id)
    const sorted = sortExperiences(experiences, 'priceAsc', null)
    const prices = experiences.flatMap((item) => (item.priceUsd === null ? [] : [item.priceUsd]))
    expect(sorted[0].priceUsd).toBe(Math.min(...prices))
    // «Precio a consultar» va al final.
    expect(sorted.at(-1)?.priceUsd).toBeNull()
    expect(experiences.map((item) => item.id)).toEqual(before)
  })

  it('mejor valoradas: las que no tienen opiniones van al final', () => {
    const stats = {
      'suchitoto-colonial': { average: 4, count: 1, breakdown: [0, 0, 0, 1, 0] as [number, number, number, number, number] },
      'amanecer-volcan-santa-ana': { average: 5, count: 3, breakdown: [0, 0, 0, 0, 3] as [number, number, number, number, number] },
    }
    const sorted = sortExperiences(experiences, 'rating', stats)
    expect(sorted.slice(0, 2).map((item) => item.id)).toEqual(['amanecer-volcan-santa-ana', 'suchitoto-colonial'])
  })
})

describe('destinos', () => {
  it('cada experiencia pertenece a un destino con página', () => {
    const pages = new Set(destinationPages().map((page) => page.destination.id))
    for (const experience of experiences) {
      const id = destinationIdByName(experience.destination)
      expect(id && pages.has(id)).toBe(true)
    }
  })

  it('todas las experiencias tienen información práctica', () => {
    for (const experience of experiences) {
      expect(experienceDetails[experience.id], experience.id).toBeDefined()
    }
  })
})

describe('tours en línea y experiencias para cotizar', () => {
  const tours = ['amanecer-volcan-santa-ana', 'santa-ana-playa-los-almendros']
  const quotedTours = ['ruta-de-las-flores-4x4', 'boqueron-centro-historico', 'centro-historico-puerta-del-diablo']

  it('solo los dos tours del Volcán de Santa Ana se reservan en línea, a precio por persona', () => {
    expect(experiences.filter(isBookableOnline).map((item) => item.id).sort()).toEqual([...tours].sort())
    const price = Object.fromEntries(experiences.map((item) => [item.id, item.priceUsd]))
    expect([85, 150]).toEqual(tours.map((id) => price[id]))
  })

  it('los demás tours se cotizan y conservan su precio de referencia', () => {
    const byId = Object.fromEntries(experiences.map((item) => [item.id, item]))
    expect(quotedTours.map((id) => byId[id]?.booking)).toEqual(['quote', 'quote', 'quote'])
    expect(quotedTours.map((id) => byId[id]?.priceUsd)).toEqual([175, 70, 65])
  })

  it('el tour del jetsky va «a consultar» y se cotiza', () => {
    const jetsky = experiences.find((item) => item.id === 'santa-ana-coatepeque-jetsky')
    expect(jetsky?.priceUsd).toBeNull()
    expect(jetsky?.booking).toBe('quote')
  })

  it('las repetidas salen del catálogo público y apuntan a su tour', () => {
    const hidden = allExperiences.filter((item) => item.hidden)
    expect(hidden.map((item) => item.id).sort()).toEqual(['centro-historico-san-salvador', 'kayak-coatepeque', 'puerta-del-diablo', 'ruta-de-las-flores', 'volcan-santa-ana'])
    for (const item of hidden) {
      expect(experiences.some((visible) => visible.id === item.id)).toBe(false)
      expect(experiences.some((visible) => visible.id === item.replacedBy)).toBe(true)
    }
  })

  it('todas tienen grupo de hasta 7', () => {
    expect(allExperiences.every((item) => item.maxPeople === 7)).toBe(true)
  })
})
