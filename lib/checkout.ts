import { z } from 'zod'
import { prisma } from './db'
import { calculatePrice, getExperiencePriceCents } from './pricing'
import {
  getUsableWelcomeBenefit,
  releaseStaleReservation,
  reserveWelcomeBenefit,
  WELCOME_BENEFIT_CODE,
} from './benefits'
import { capacityFor, checkBookableDate, findExperience, HOLD_MINUTES, seatsTaken } from './availability'
import { validateCustomer, type CustomerErrors } from './checkout-validation'
import { newBookingCode, randomToken, sanitizePhone, sanitizeText } from './security'

/**
 * Creación de reservas desde el checkout. SOLO SERVIDOR.
 *
 * El navegador manda QUÉ quiere (experiencia, fecha, viajeros, datos de
 * contacto). El servidor decide CUÁNTO cuesta: el precio sale del
 * catálogo, el descuento de la base de datos y el total de calculatePrice.
 * Si el cuerpo trae importes, se ignoran: el esquema ni los contempla.
 */

export const checkoutSchema = z.object({
  experienceId: z.string().trim().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  people: z.number().int().min(1).max(50),
  customer: z.object({
    name: z.string().max(200),
    email: z.string().max(300),
    phone: z.string().max(40),
    country: z.string().max(100).optional().default(''),
  }),
  acceptTerms: z.literal(true),
  applyWelcomeDiscount: z.boolean().optional().default(false),
  /** Lo genera el formulario una vez; los reintentos mandan la misma. */
  idempotencyKey: z.string().regex(/^[A-Za-z0-9-]{16,64}$/),
  locale: z.enum(['ES', 'EN']).optional().default('EN'),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export type CheckoutFailure =
  | { code: 'experienceNotFound'; status: 404 }
  | { code: 'invalidCustomer'; status: 422; fields: CustomerErrors }
  | { code: 'invalidDate' | 'dateTooSoon' | 'dateTooFar' | 'notOperating'; status: 422 }
  | { code: 'tooManyPeople'; status: 422; max: number }
  | { code: 'soldOut'; status: 409; remaining: number }
  | { code: 'benefitUnavailable'; status: 409 }

export type CreatedBooking = {
  id: string
  code: string
  accessToken: string
  experienceTitle: string
  experienceImage: string | null
  date: string
  people: number
  totalCents: number
  currency: string
  status: string
  /** true = ya existía (mismo idempotencyKey o reserva pendiente idéntica). */
  reused: boolean
  pendingCheckoutUrl: string | null
}

class Failure extends Error {
  constructor(readonly failure: CheckoutFailure) {
    super(failure.code)
  }
}

/**
 * Crea la reserva en PENDING_PAYMENT, apartando plazas y descuento.
 *
 * Contra reservas duplicadas:
 *   1. idempotencyKey único: el mismo envío dos veces devuelve la misma.
 *   2. Misma persona y misma salida con un apartado vigente → se libera
 *      el anterior, para que un reenvío no reserve las plazas dos veces.
 */
export async function createPendingBooking(
  input: CheckoutInput,
  options: { userId: string | null; isTest: boolean },
): Promise<{ ok: true; booking: CreatedBooking } | { ok: false; failure: CheckoutFailure }> {
  const experience = findExperience(input.experienceId)
  if (!experience) return { ok: false, failure: { code: 'experienceNotFound', status: 404 } }

  const customer = {
    name: sanitizeText(input.customer.name, 80),
    email: input.customer.email.trim().toLowerCase().slice(0, 254),
    phone: sanitizePhone(input.customer.phone),
    country: sanitizeText(input.customer.country ?? '', 56),
  }
  const fields = validateCustomer({ ...customer, phone: input.customer.phone })
  if (Object.keys(fields).length > 0) {
    return { ok: false, failure: { code: 'invalidCustomer', status: 422, fields } }
  }

  const dateCheck = checkBookableDate(experience, input.date)
  if (!dateCheck.ok) return { ok: false, failure: { code: dateCheck.reason, status: 422 } }

  if (input.people > experience.maxPeople) {
    return { ok: false, failure: { code: 'tooManyPeople', status: 422, max: experience.maxPeople } }
  }

  // 1. ¿Este mismo envío ya se procesó?
  const previous = await prisma.booking.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  if (previous) {
    return { ok: true, booking: toCreated(previous, true, previous.payments[0]?.checkoutUrl ?? null) }
  }

  const now = new Date()

  // 2. ¿La misma persona tiene ya un apartado vigente para esa salida?
  //    Se libera el anterior antes de crear el nuevo: un cliente que vuelve
  //    atrás y reenvía no acapara plazas por partida doble.
  //
  //    NO se le devuelve la reserva anterior: bastaría con conocer un correo
  //    para obtener la llave de acceso de otra persona. Liberarla es
  //    inofensivo: si esa persona paga igualmente, el pago se respeta.
  const duplicates = await prisma.booking.findMany({
    where: {
      customerEmail: customer.email,
      experienceId: experience.id,
      date: input.date,
      status: 'PENDING_PAYMENT',
      holdExpiresAt: { gt: now },
    },
    select: { id: true, userId: true },
  })
  for (const duplicate of duplicates) {
    await cancelUnpaidBooking(duplicate.id, duplicate.userId)
  }

  // Descuento: solo con sesión, y consultado en la base de datos.
  let discountPct = 0
  if (options.userId && input.applyWelcomeDiscount) {
    await releaseStaleReservation(prisma, options.userId, now)
    const benefit = await getUsableWelcomeBenefit(options.userId)
    if (!benefit) return { ok: false, failure: { code: 'benefitUnavailable', status: 409 } }
    discountPct = benefit.percentage
  }

  const unitPriceCents = getExperiencePriceCents(experience.id)
  if (unitPriceCents === null) return { ok: false, failure: { code: 'experienceNotFound', status: 404 } }
  const price = calculatePrice(unitPriceCents, input.people, discountPct)

  try {
    const booking = await withRetry(() =>
      prisma.$transaction(
        async (tx) => {
          // Cupo: se comprueba DENTRO de la transacción serializable.
          const [capacity, taken] = await Promise.all([
            capacityFor(tx, experience, input.date),
            seatsTaken(tx, experience.id, input.date, now),
          ])
          const remaining = Math.max(0, capacity - taken)
          if (price.people > remaining) {
            throw new Failure({ code: 'soldOut', status: 409, remaining })
          }

          const created = await tx.booking.create({
            data: {
              code: newBookingCode(),
              userId: options.userId,
              customerName: customer.name,
              customerEmail: customer.email,
              customerPhone: customer.phone,
              customerCountry: customer.country || null,
              accessToken: randomToken(32),
              idempotencyKey: input.idempotencyKey,
              isTest: options.isTest,
              holdExpiresAt: new Date(now.getTime() + HOLD_MINUTES * 60_000),
              termsAcceptedAt: now,
              locale: input.locale,
              experienceId: experience.id,
              experienceTitle: experience.title,
              experienceImage: experience.image,
              destination: experience.destination,
              date: input.date,
              people: price.people,
              unitPriceCents: price.unitPriceCents,
              subtotalCents: price.subtotalCents,
              discountCents: price.discountCents,
              totalCents: price.totalCents,
              discountPct: price.discountPct,
              benefitCode: discountPct > 0 ? WELCOME_BENEFIT_CODE : null,
              status: 'PENDING_PAYMENT',
            },
          })

          if (discountPct > 0 && options.userId) {
            const reserved = await reserveWelcomeBenefit(tx, options.userId, created.id)
            if (!reserved) throw new Failure({ code: 'benefitUnavailable', status: 409 })
          }

          return created
        },
        { isolationLevel: 'Serializable' },
      ),
    )

    return { ok: true, booking: toCreated(booking, false, null) }
  } catch (error) {
    if (error instanceof Failure) return { ok: false, failure: error.failure }
    if (isUniqueOn(error, 'idempotencyKey')) {
      // Dos envíos idénticos a la vez: el otro ganó. Se devuelve el suyo.
      const winner = await prisma.booking.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      })
      if (winner) return { ok: true, booking: toCreated(winner, true, winner.payments[0]?.checkoutUrl ?? null) }
    }
    throw error
  }
}

/** Cancela una reserva que no llegó a tener enlace de pago y libera todo. */
export async function cancelUnpaidBooking(bookingId: string, userId: string | null) {
  await prisma.$transaction(async (tx) => {
    await tx.booking.updateMany({
      where: { id: bookingId, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED', cancelledAt: new Date(), holdExpiresAt: null },
    })
    if (userId) {
      await tx.userBenefit.updateMany({
        where: { userId, status: 'RESERVED', usedOnBookingId: bookingId },
        data: { status: 'AVAILABLE', usedOnBookingId: null },
      })
    }
  })
}

function toCreated(
  booking: {
    id: string
    code: string
    accessToken: string
    experienceTitle: string
    experienceImage: string | null
    date: string
    people: number
    totalCents: number
    currency: string
    status: string
  },
  reused: boolean,
  pendingCheckoutUrl: string | null,
): CreatedBooking {
  return {
    id: booking.id,
    code: booking.code,
    accessToken: booking.accessToken,
    experienceTitle: booking.experienceTitle,
    experienceImage: booking.experienceImage,
    date: booking.date,
    people: booking.people,
    totalCents: booking.totalCents,
    currency: booking.currency,
    status: booking.status,
    reused,
    pendingCheckoutUrl,
  }
}

function prismaCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : null
}

function isUniqueOn(error: unknown, field: string): boolean {
  if (prismaCode(error) !== 'P2002') return false
  const target = (error as { meta?: { target?: unknown } }).meta?.target
  return Array.isArray(target) ? target.includes(field) : String(target ?? '').includes(field)
}

/**
 * Reintenta ante conflictos de concurrencia (P2034 en transacciones
 * serializables) y ante el choque, rarísimo, de un código de reserva
 * aleatorio repetido.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const code = prismaCode(error)
      const retriable = code === 'P2034' || (code === 'P2002' && (isUniqueOn(error, 'code') || isUniqueOn(error, 'accessToken')))
      if (!retriable) throw error
    }
  }
  throw lastError
}
