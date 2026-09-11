import { parseLocalDate, toIsoDate } from './data'

/**
 * Fechas en la zona horaria de El Salvador. Funciones puras: las usan el
 * servidor y el navegador, así los dos coinciden en qué día es «hoy».
 */

const TIME_ZONE = 'America/El_Salvador'

/** Reservar con, como mucho, un año de antelación. */
export const MAX_DAYS_AHEAD = 365

/**
 * Hoy en El Salvador, como AAAA-MM-DD.
 *
 * El servidor de Netlify corre en UTC: a las 7 p. m. de El Salvador ya es
 * «mañana» en UTC. Sin esto, se podría reservar para hoy de noche o
 * rechazarse una fecha válida.
 */
export function todayInElSalvador(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseLocalDate(iso)
  if (!date) return iso
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Primera y última fecha reservables: desde mañana hasta dentro de un año. */
export function bookableRange(now = new Date()): { first: string; last: string } {
  const today = todayInElSalvador(now)
  return { first: addDaysIso(today, 1), last: addDaysIso(today, MAX_DAYS_AHEAD) }
}
