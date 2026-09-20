import { experiences } from '../data'

/**
 * Filtros del panel. Viven en la URL (?from=…&to=…&experiencia=…), no en
 * estado de cliente: así el enlace se puede compartir y guardar, y la
 * página sigue siendo un Server Component que consulta con los filtros ya
 * aplicados.
 *
 * TODO valor que llega por la URL se valida aquí antes de tocar la base:
 * una fecha tiene que ser AAAA-MM-DD, la experiencia tiene que existir en
 * el catálogo y el estado tiene que ser uno de los de BookingStatus. Lo
 * que no encaje se descarta en silencio y el panel se muestra sin ese
 * filtro, en vez de reventar con una consulta inválida.
 */

export const BOOKING_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
] as const

export type BookingStatusFilter = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS_LABEL: Record<BookingStatusFilter, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export type AdminFilters = {
  from: string | null
  to: string | null
  experienceId: string | null
  destination: string | null
  status: BookingStatusFilter | null
  /** Incluir reservas creadas con pagos simulados o en sandbox. */
  includeTest: boolean
}

export type AdminSearchParams = Record<string, string | string[] | undefined>

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isoDate(value: string): string | null {
  if (!ISO_DATE.test(value)) return null
  // Rechaza 2026-02-31 y demás fechas que existen como texto pero no en el
  // calendario.
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
}

/**
 * Atajo de mes: ?mes=2026-09 equivale a from=2026-09-01 & to=2026-09-30.
 * Se usa para los accesos rápidos («este mes») sin duplicar parámetros.
 */
function monthRange(value: string): { from: string; to: string } | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null
  const [year, month] = value.split('-').map(Number)
  if (month < 1 || month > 12) return null
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { from: `${value}-01`, to: `${value}-${String(last).padStart(2, '0')}` }
}

/** Atajo de año: ?anio=2026. */
function yearRange(value: string): { from: string; to: string } | null {
  if (!/^\d{4}$/.test(value)) return null
  return { from: `${value}-01-01`, to: `${value}-12-31` }
}

export function parseFilters(params: AdminSearchParams): AdminFilters {
  const mes = monthRange(one(params.mes))
  const anio = yearRange(one(params.anio))
  const atajo = mes ?? anio

  let from = isoDate(one(params.from)) ?? atajo?.from ?? null
  let to = isoDate(one(params.to)) ?? atajo?.to ?? null

  // Un rango al revés no filtra nada útil: se ordena en vez de devolver
  // una lista vacía que parecería un error de datos.
  if (from && to && from > to) [from, to] = [to, from]

  const experienceId = one(params.experiencia)
  const destination = one(params.destino)
  const status = one(params.estado)

  return {
    from,
    to,
    experienceId: experiences.some((item) => item.id === experienceId) ? experienceId : null,
    destination: experiences.some((item) => item.destination === destination) ? destination : null,
    status: (BOOKING_STATUSES as readonly string[]).includes(status)
      ? (status as BookingStatusFilter)
      : null,
    includeTest: one(params.pruebas) === '1',
  }
}

/** ¿Hay algún filtro activo? Para mostrar el botón de «limpiar». */
export function hasFilters(filters: AdminFilters): boolean {
  return Boolean(
    filters.from || filters.to || filters.experienceId || filters.destination || filters.status || filters.includeTest,
  )
}
