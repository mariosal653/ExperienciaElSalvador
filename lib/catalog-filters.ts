import type { Experience } from './data'
import { getExperienceDetails } from './experience-details'
import type { ReviewStats } from './reviews/types'

/**
 * Filtros finos y orden del catálogo. Funciones puras: complementan la
 * búsqueda (destino, fecha, viajeros) y la categoría de lib/data.ts.
 */

export type SortKey = 'recommended' | 'priceAsc' | 'priceDesc' | 'rating' | 'duration'

export type Refinements = {
  /** 'half' = hasta 5 h · 'full' = más de 5 h. */
  duration: 'any' | 'half' | 'full'
  /** Precio máximo por persona en USD, o null. */
  maxPrice: number | null
  /** Solo las aptas para niños pequeños (edad mínima de 6 años o menos). */
  family: boolean
  /** Solo las de dificultad fácil. */
  easy: boolean
}

export const emptyRefinements: Refinements = { duration: 'any', maxPrice: null, family: false, easy: false }

export const HALF_DAY_MAX_HOURS = 5
export const FAMILY_MAX_AGE = 6
export const PRICE_STEPS = [30, 40, 50] as const

export function hasRefinements(refine: Refinements): boolean {
  return refine.duration !== 'any' || refine.maxPrice !== null || refine.family || refine.easy
}

export function applyRefinements(list: Experience[], refine: Refinements): Experience[] {
  return list.filter((item) => {
    if (refine.duration === 'half' && item.durationHours > HALF_DAY_MAX_HOURS) return false
    if (refine.duration === 'full' && item.durationHours <= HALF_DAY_MAX_HOURS) return false
    if (refine.maxPrice !== null && item.priceUsd > refine.maxPrice) return false
    const details = getExperienceDetails(item.id)
    if (refine.family && (!details || details.minAge > FAMILY_MAX_AGE)) return false
    if (refine.easy && details?.difficulty !== 'easy') return false
    return true
  })
}

/**
 * Ordena sin modificar la lista original. «Recomendadas» respeta el orden
 * editorial del catálogo. «Mejor valoradas» usa solo opiniones reales: las
 * que no tienen van al final, y a igual media gana la que tiene más.
 */
export function sortExperiences(list: Experience[], sort: SortKey, stats: ReviewStats | null | undefined): Experience[] {
  const sorted = [...list]
  switch (sort) {
    case 'priceAsc':
      return sorted.sort((a, b) => a.priceUsd - b.priceUsd)
    case 'priceDesc':
      return sorted.sort((a, b) => b.priceUsd - a.priceUsd)
    case 'duration':
      return sorted.sort((a, b) => a.durationHours - b.durationHours)
    case 'rating':
      return sorted.sort((a, b) => {
        const ra = stats?.[a.id]
        const rb = stats?.[b.id]
        if (!ra && !rb) return 0
        if (!ra) return 1
        if (!rb) return -1
        return rb.average - ra.average || rb.count - ra.count
      })
    default:
      return sorted
  }
}
