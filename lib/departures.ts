import { parseLocalDate } from './data'
import { addDaysIso, bookableRange } from './dates'

/**
 * Próximas salidas según el calendario semanal de la experiencia.
 *
 * Es orientativo: no conoce el cupo ni las fechas cerradas en la tabla
 * `availability`. Sirve para decir «Próxima salida: sáb 3 oct» y proponer
 * fechas; la disponibilidad real la confirma el checkout.
 */
export function nextDepartures(weekdays: number[], count: number, now = new Date()): string[] {
  const { first, last } = bookableRange(now)
  const found: string[] = []
  let day = first
  // Como mucho dos semanas por salida pedida: basta para cualquier calendario.
  for (let i = 0; i < count * 14 && found.length < count && day <= last; i++) {
    const date = parseLocalDate(day)
    if (date && weekdays.includes(date.getDay())) found.push(day)
    day = addDaysIso(day, 1)
  }
  return found
}

const WEEKDAY_SHORT = {
  ES: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  EN: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
const MONTH_SHORT = {
  ES: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  EN: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

/** «sáb 3 oct» / «Sat, Oct 3». */
export function formatDeparture(iso: string, lang: 'ES' | 'EN'): string {
  const date = parseLocalDate(iso)
  if (!date) return iso
  const weekday = WEEKDAY_SHORT[lang][date.getDay()]
  const month = MONTH_SHORT[lang][date.getMonth()]
  return lang === 'ES' ? `${weekday} ${date.getDate()} ${month}` : `${weekday}, ${month} ${date.getDate()}`
}

/** «mañana» si la salida es mañana; si no, la fecha corta. */
export function departureLabel(iso: string, lang: 'ES' | 'EN', now = new Date()): string {
  const { first } = bookableRange(now)
  if (iso === first) return lang === 'ES' ? 'mañana' : 'tomorrow'
  return formatDeparture(iso, lang)
}
