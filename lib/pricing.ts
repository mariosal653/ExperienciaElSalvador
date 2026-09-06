/**
 * Cálculo de precios. FUNCIONES PURAS, en centavos enteros.
 *
 * El servidor NUNCA confía en el precio que envía el navegador: busca la
 * experiencia en el catálogo, toma su precio y calcula aquí. El cliente
 * solo dice qué experiencia, qué fecha y cuántas personas.
 */

import { experiences } from './data'

export type PriceBreakdown = {
  unitPriceCents: number
  people: number
  subtotalCents: number
  discountPct: number
  discountCents: number
  totalCents: number
}

/** Redondeo comercial al centavo. */
function roundCents(value: number): number {
  return Math.round(value)
}

/**
 * @param discountPct 0 a 100. El descuento se aplica sobre el subtotal.
 */
export function calculatePrice(
  unitPriceCents: number,
  people: number,
  discountPct: number,
): PriceBreakdown {
  const safePeople = Math.max(1, Math.floor(people))
  const safePct = Math.min(100, Math.max(0, Math.floor(discountPct)))

  const subtotalCents = unitPriceCents * safePeople
  const discountCents = roundCents((subtotalCents * safePct) / 100)
  const totalCents = subtotalCents - discountCents

  return {
    unitPriceCents,
    people: safePeople,
    subtotalCents,
    discountPct: safePct,
    discountCents,
    totalCents,
  }
}

/** Precio del catálogo, en centavos. `null` si la experiencia no existe. */
export function getExperiencePriceCents(experienceId: string): number | null {
  const experience = experiences.find((item) => item.id === experienceId)
  if (!experience) return null
  return Math.round(experience.priceUsd * 100)
}

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}
