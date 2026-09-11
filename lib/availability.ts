import type { Prisma, PrismaClient } from '@prisma/client'
import { experiences, parseLocalDate, type Experience } from './data'
import { bookableRange } from './dates'

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
