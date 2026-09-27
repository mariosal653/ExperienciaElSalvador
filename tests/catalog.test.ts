import { describe, it, expect } from 'vitest'
import { experiences } from '../lib/data'
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
    expect(applyRefinements(experiences, { ...emptyRefinements, maxPrice: 30 }).every((item) => item.priceUsd <= 30)).toBe(true)
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
    expect(sorted[0].priceUsd).toBe(Math.min(...experiences.map((item) => item.priceUsd)))
    expect(experiences.map((item) => item.id)).toEqual(before)
  })

  it('mejor valoradas: las que no tienen opiniones van al final', () => {
    const stats = {
      'kayak-coatepeque': { average: 4, count: 1, breakdown: [0, 0, 0, 1, 0] as [number, number, number, number, number] },
      'volcan-santa-ana': { average: 5, count: 3, breakdown: [0, 0, 0, 0, 3] as [number, number, number, number, number] },
    }
    const sorted = sortExperiences(experiences, 'rating', stats)
    expect(sorted.slice(0, 2).map((item) => item.id)).toEqual(['volcan-santa-ana', 'kayak-coatepeque'])
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
