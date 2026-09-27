import { parseLocalDate } from './data'

/**
 * «Reserva ahora, paga después».
 *
 * El cliente aparta sus plazas sin pagar y paga más tarde desde la página
 * de su reserva. El plazo para pagar coincide con el fin de la cancelación
 * gratuita: 48 h antes de la salida. Si no paga a tiempo, la reserva vence
 * sola y las plazas vuelven a estar libres (el cupo solo cuenta los
 * apartados vigentes, ver lib/availability.ts).
 *
 * Funciones puras: las usan el servidor, que decide, y el navegador, que
 * solo muestra la opción.
 */

/** Horas antes de la salida en que vence el plazo para pagar. */
export const PAY_LATER_DEADLINE_HOURS = 48

/**
 * Margen mínimo entre la reserva y el vencimiento. Con menos de un día no
 * tiene sentido «pagar después»: se ofrece solo el pago inmediato.
 */
export const PAY_LATER_MIN_HOURS = 24

/** El Salvador está en UTC−6 todo el año (no tiene horario de verano). */
const EL_SALVADOR_UTC_OFFSET_HOURS = 6

const HOUR = 60 * 60 * 1000

/**
 * Plazo para pagar: la medianoche (hora de El Salvador) del día de la
 * salida, menos 48 horas, menos un minuto. El minuto hace que se lea
 * «hasta el martes a las 11:59 p. m.» en lugar de un confuso «miércoles a
 * las 12:00 a. m.».
 */
export function payLaterDeadline(date: string): Date | null {
  const local = parseLocalDate(date)
  if (!local) return null
  const departureMidnightUtc = Date.UTC(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    EL_SALVADOR_UTC_OFFSET_HOURS,
  )
  return new Date(departureMidnightUtc - PAY_LATER_DEADLINE_HOURS * HOUR - 60_000)
}

/** ¿Se puede ofrecer «pagar después» para esa fecha? */
export function canPayLater(date: string, now = new Date()): boolean {
  const deadline = payLaterDeadline(date)
  if (!deadline) return false
  return deadline.getTime() - now.getTime() >= PAY_LATER_MIN_HOURS * HOUR
}

/** «jueves 1 de octubre, 12:00 a. m.» / «Thursday, October 1, 12:00 AM», en hora de El Salvador. */
export function formatDeadline(deadline: Date, lang: 'ES' | 'EN'): string {
  return new Intl.DateTimeFormat(lang === 'ES' ? 'es-SV' : 'en-US', {
    timeZone: 'America/El_Salvador',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(deadline)
}
