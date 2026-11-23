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

/**
 * Precio por persona de una salida, en centavos. `null` = no se vende en
 * línea (experiencias para cotizar).
 *
 * Hoy es el mismo todos los días: el del catálogo. `date` está para cuando
 * haya tarifas por fecha (temporada alta, feriados): bastará con cambiar
 * esta función y el calendario, el resumen y el cobro las seguirán.
 */
export function unitPriceCentsFor(
  experience: { priceUsd: number | null; booking?: 'online' | 'quote' },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  date?: string,
): number | null {
  if (experience.priceUsd === null) return null
  if (experience.booking !== undefined && experience.booking !== 'online') return null
  return Math.round(experience.priceUsd * 100)
}

/**
 * EL precio de una reserva: el que muestra cada día del calendario, el del
 * resumen y el que cobra el servidor. Una sola función para que los tres
 * números no puedan separarse.
 */
export function quote(
  experience: { priceUsd: number | null; booking?: 'online' | 'quote' },
  date: string | undefined,
  people: number,
  discountPct = 0,
): PriceBreakdown | null {
  const unit = unitPriceCentsFor(experience, date)
  return unit === null ? null : calculatePrice(unit, people, discountPct)
}

/** Total redondeado al dólar y sin separador de miles, para las celdas del calendario: «$180». */
export function formatWholeDollars(cents: number): string {
  return `$${Math.round(cents / 100)}`
}

/** Precio del catálogo, en centavos. `null` si la experiencia no existe. */
export function getExperiencePriceCents(experienceId: string): number | null {
  const experience = experiences.find((item) => item.id === experienceId)
  // Las que son para cotizar no tienen precio cobrable en la web.
  return experience ? unitPriceCentsFor(experience) : null
}

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}
