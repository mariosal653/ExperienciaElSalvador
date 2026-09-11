import QRCode from 'qrcode'
import type { Prisma, PrismaClient } from '@prisma/client'
import { randomToken } from './security'
import { getSiteUrl } from './site'

/**
 * Entradas digitales. SOLO SERVIDOR.
 *
 *  - Una por viajero, y solo cuando la reserva está PAGADA.
 *  - El QR lleva únicamente una URL con un token aleatorio de 192 bits:
 *    ni nombre, ni correo, ni importe. Quien lo escanee sin permiso de
 *    personal solo ve el estado de la entrada.
 *  - `@@unique([bookingId, number])` hace que emitirlas sea idempotente: si
 *    dos procesos lo intentan a la vez, el segundo no crea nada.
 */

type Client = PrismaClient | Prisma.TransactionClient

export function ticketUrl(token: string): string {
  return `${getSiteUrl()}/ticket/validate/${token}`
}

/**
 * Emite las entradas que falten de la reserva. Devuelve cuántas creó.
 * Llamarla dos veces no duplica nada.
 */
export async function issueTickets(
  client: Client,
  booking: { id: string; code: string; people: number; experienceId: string; date: string },
): Promise<number> {
  const existing = await client.ticket.findMany({
    where: { bookingId: booking.id },
    select: { number: true },
  })
  const have = new Set(existing.map((ticket) => ticket.number))

  const missing: Prisma.TicketCreateManyInput[] = []
  for (let number = 1; number <= booking.people; number++) {
    if (have.has(number)) continue
    missing.push({
      bookingId: booking.id,
      number,
      code: `${booking.code}-${number}`,
      experienceId: booking.experienceId,
      date: booking.date,
      token: randomToken(24),
    })
  }

  if (missing.length === 0) return 0

  // Una a una en vez de createMany: SQLite no admite skipDuplicates y un
  // choque con el índice único debe ignorarse, no abortar el resto.
  let created = 0
  for (const data of missing) {
    try {
      await client.ticket.create({ data })
      created += 1
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
    }
  }
  return created
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002'
}

/** QR en SVG, listo para incrustar. Se genera en el servidor. */
export async function ticketQrSvg(token: string): Promise<string> {
  return QRCode.toString(ticketUrl(token), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#173f45', light: '#ffffff' },
  })
}

export type TicketValidity = 'ACTIVE' | 'USED' | 'CANCELLED' | 'INVALID'

/** Formato del token: base64url de 24 bytes = 32 caracteres. */
export function looksLikeTicketToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(token)
}
