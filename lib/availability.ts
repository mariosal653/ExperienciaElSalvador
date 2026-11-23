import type { Prisma, PrismaClient } from '@prisma/client'
import { experiences, parseLocalDate, type Experience } from './data'
import { bookableRange } from './dates'
import { quote } from './pricing'

/**
 * Disponibilidad y cupo por fecha. SOLO SERVIDOR.
 *
 * Una experiencia sale los días de la semana del catálogo, con un cupo
 * de `maxPeople` por salida. La tabla `availability` permite cerrar una
 * fecha o cambiarle el cupo sin tocar el código.
 *
 * Plazas ocupadas = viajeros de reservas pagadas o confirmadas, más los de
 * reservas con el pago en curso cuyo apartado aún no ha vencido. Así dos
 * clientes no pueden pagar la última plaza a la vez.
 */

type Client = PrismaClient | Prisma.TransactionClient

/** Minutos que se guardan las plazas mientras el cliente paga. */
export const HOLD_MINUTES = 30

export { todayInElSalvador } from './dates'

export type DateCheck =
  | { ok: true }
  | { ok: false; reason: 'invalidDate' | 'dateTooSoon' | 'dateTooFar' | 'notOperating' }

/**
 * ¿Se puede reservar esta fecha? Desde MAÑANA (hora de El Salvador): el
 * operador necesita al menos un día para organizar el grupo.
 */
export function checkBookableDate(experience: Experience, iso: string, now = new Date()): DateCheck {
  const date = parseLocalDate(iso)
  if (!date) return { ok: false, reason: 'invalidDate' }

  const { first, last } = bookableRange(now)
  // Comparación de cadenas AAAA-MM-DD: orden lexicográfico = cronológico.
  if (iso < first) return { ok: false, reason: 'dateTooSoon' }
  if (iso > last) return { ok: false, reason: 'dateTooFar' }
  if (!experience.weekdays.includes(date.getDay())) return { ok: false, reason: 'notOperating' }
  return { ok: true }
}

export function findExperience(id: string): Experience | null {
  return experiences.find((item) => item.id === id) ?? null
}

/** Cupo total de esa salida, o 0 si la fecha está cerrada. */
export async function capacityFor(client: Client, experience: Experience, date: string): Promise<number> {
  const override = await client.availability.findUnique({
    where: { experienceId_date: { experienceId: experience.id, date } },
  })
  if (override?.closed) return 0
  return override?.capacity ?? experience.maxPeople
}

/** Viajeros que ya ocupan plaza en esa salida. */
export async function seatsTaken(
  client: Client,
  experienceId: string,
  date: string,
  now = new Date(),
  excludeBookingId?: string,
): Promise<number> {
  const result = await client.booking.aggregate({
    _sum: { people: true },
    where: {
      experienceId,
      date,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      OR: [
        { status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] } },
        { status: 'PENDING_PAYMENT', holdExpiresAt: { gt: now } },
      ],
    },
  })
  return result._sum.people ?? 0
}

export type SeatsInfo = {
  capacity: number
  taken: number
  remaining: number
}

export async function seatsFor(client: Client, experience: Experience, date: string): Promise<SeatsInfo> {
  const [capacity, taken] = await Promise.all([
    capacityFor(client, experience, date),
    seatsTaken(client, experience.id, date),
  ])
  return { capacity, taken, remaining: Math.max(0, capacity - taken) }
}

/* ------------------------------------------------------------------ */
/* Calendario del checkout: un mes entero de una vez                   */
/* ------------------------------------------------------------------ */

/**
 * Estado de un día para un grupo de `people` personas:
 *   available    se puede reservar
 *   limited      quedan plazas, pero menos que el grupo («Solo 2 lugares»)
 *   soldOut      no queda ninguna plaza
 *   closed       el operador cerró la fecha (feriado, clima)
 *   unavailable  la experiencia no sale ese día, o está fuera de plazo
 */
export type DayStatus = 'available' | 'limited' | 'soldOut' | 'closed' | 'unavailable'

export type DayAvailability = {
  date: string
  status: DayStatus
  remaining: number
  /** Precio por persona de ese día. `null` si no se puede reservar. */
  unitPriceCents: number | null
  /** Total del grupo, sin descuentos. `null` si no se puede reservar. */
  totalCents: number | null
}

/** Clasifica un día. Función pura: la usan el servidor y las pruebas. */
export function dayStatus(input: {
  bookable: boolean
  closed: boolean
  capacity: number
  taken: number
  people: number
}): { status: DayStatus; remaining: number } {
  if (!input.bookable) return { status: 'unavailable', remaining: 0 }
  if (input.closed || input.capacity <= 0) return { status: 'closed', remaining: 0 }
  const remaining = Math.max(0, input.capacity - input.taken)
  if (remaining === 0) return { status: 'soldOut', remaining }
  if (remaining < input.people) return { status: 'limited', remaining }
  return { status: 'available', remaining }
}

/** Días AAAA-MM-DD de un mes AAAA-MM. */
export function daysOfMonth(month: string): string[] {
  const [year, monthNumber] = month.split('-').map(Number)
  const count = new Date(year, monthNumber, 0).getDate()
  return Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)
}

/**
 * Disponibilidad y precio de todos los días de un mes para un grupo.
 *
 * Dos consultas para el mes entero (excepciones y plazas ocupadas), no
 * una por día. El precio sale de `quote()`, la misma función que cobra.
 */
export async function monthAvailability(
  client: Client,
  experience: Experience,
  month: string,
  people: number,
  now = new Date(),
): Promise<DayAvailability[]> {
  const prefix = `${month}-`
  const [overrides, taken] = await Promise.all([
    client.availability.findMany({
      where: { experienceId: experience.id, date: { startsWith: prefix } },
    }),
    client.booking.groupBy({
      by: ['date'],
      _sum: { people: true },
      where: {
        experienceId: experience.id,
        date: { startsWith: prefix },
        OR: [
          { status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] } },
          { status: 'PENDING_PAYMENT', holdExpiresAt: { gt: now } },
        ],
      },
    }),
  ])

  const overrideByDate = new Map(overrides.map((row) => [row.date, row]))
  const takenByDate = new Map(taken.map((row) => [row.date, row._sum.people ?? 0]))

  return daysOfMonth(month).map((date) => {
    const override = overrideByDate.get(date)
    const { status, remaining } = dayStatus({
      bookable: checkBookableDate(experience, date, now).ok,
      closed: override?.closed ?? false,
      capacity: override?.capacity ?? experience.maxPeople,
      taken: takenByDate.get(date) ?? 0,
      people,
    })
    const price = status === 'available' ? quote(experience, date, people) : null
    return {
      date,
      status,
      remaining,
      unitPriceCents: price?.unitPriceCents ?? null,
      totalCents: price?.totalCents ?? null,
    }
  })
}
