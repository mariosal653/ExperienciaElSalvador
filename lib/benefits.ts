import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from './db'

/**
 * Descuento de bienvenida.
 *
 * Reglas que sostiene este módulo:
 *
 *  - Solo se crea al dar de alta un usuario. Un `@@unique([userId, code])`
 *    en la base de datos impide que alguien acumule dos.
 *  - Los usuarios anteriores a esta funcionalidad NO lo reciben: solo se
 *    concede dentro de la transacción que crea la cuenta.
 *  - Cerrar sesión, borrar cookies o cambiar de dispositivo no genera uno
 *    nuevo, porque vive en la base de datos y va atado al `userId`.
 *  - Consumirlo es un UPDATE CONDICIONAL sobre `status: AVAILABLE`. Dos
 *    peticiones simultáneas no pueden gastarlo dos veces: la segunda
 *    actualiza 0 filas y se rechaza.
 */

export const WELCOME_BENEFIT_CODE = 'WELCOME25'
export const WELCOME_BENEFIT_PERCENTAGE = 25

/** Días de validez. `null` = sin caducidad. */
const WELCOME_BENEFIT_DAYS = 365

type Client = PrismaClient | Prisma.TransactionClient

/**
 * Concede el beneficio de bienvenida.
 *
 * Debe llamarse DENTRO de la transacción que crea el usuario, para que una
 * cuenta nunca exista sin su beneficio ni al revés.
 */
export async function grantWelcomeBenefit(client: Client, userId: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + WELCOME_BENEFIT_DAYS)

  return client.userBenefit.create({
    data: {
      userId,
      code: WELCOME_BENEFIT_CODE,
      percentage: WELCOME_BENEFIT_PERCENTAGE,
      status: 'AVAILABLE',
      expiresAt,
    },
  })
}

/** Beneficio de bienvenida del usuario, exista o no. */
export async function getWelcomeBenefit(userId: string) {
  return prisma.userBenefit.findUnique({
    where: { userId_code: { userId, code: WELCOME_BENEFIT_CODE } },
  })
}

/**
 * ¿Puede usarse ahora? Comprueba estado y caducidad.
 * No modifica nada: es la consulta que alimenta la interfaz.
 */
export async function getUsableWelcomeBenefit(userId: string) {
  const benefit = await getWelcomeBenefit(userId)
  if (!benefit) return null
  if (benefit.status !== 'AVAILABLE') return null
  if (benefit.expiresAt && benefit.expiresAt.getTime() < Date.now()) return null
  return benefit
}

/**
 * Marca el popup como descartado. NO consume el descuento: solo deja de
 * mostrarse automáticamente. El beneficio sigue visible en el perfil.
 */
export async function dismissWelcomeModal(userId: string) {
  await prisma.userBenefit.updateMany({
    where: { userId, code: WELCOME_BENEFIT_CODE },
    data: { modalDismissed: true },
  })
}

/* ------------------------------------------------------------------ */
/* Con pago: apartar → usar / liberar                                  */
/* ------------------------------------------------------------------ */
//
// Con pasarela de pago, la reserva no se confirma al enviarla sino cuando
// el pago se aprueba, minutos después. Por eso el descuento se APARTA al
// crear la reserva (AVAILABLE → RESERVED) y se da por USADO al aprobarse
// el pago. Si el pago no llega, se LIBERA y vuelve a estar disponible.
//
// Apartarlo es un update condicional: dos pestañas con el mismo descuento
// no pueden llevarlo a dos pagos distintos.

/**
 * Libera el descuento apartado para una reserva cuyo pago ya no va a
 * llegar (apartado vencido o reserva cancelada). Se llama antes de mirar
 * si hay descuento disponible.
 */
export async function releaseStaleReservation(client: Client, userId: string, now = new Date()) {
  const benefit = await client.userBenefit.findUnique({
    where: { userId_code: { userId, code: WELCOME_BENEFIT_CODE } },
  })
  if (!benefit || benefit.status !== 'RESERVED' || !benefit.usedOnBookingId) return

  const booking = await client.booking.findUnique({
    where: { id: benefit.usedOnBookingId },
    select: { status: true, holdExpiresAt: true },
  })

  const stale =
    !booking ||
    booking.status === 'CANCELLED' ||
    (booking.status === 'PENDING_PAYMENT' && booking.holdExpiresAt !== null && booking.holdExpiresAt < now)

  if (stale) {
    await client.userBenefit.updateMany({
      where: { id: benefit.id, status: 'RESERVED', usedOnBookingId: benefit.usedOnBookingId },
      data: { status: 'AVAILABLE', usedOnBookingId: null },
    })
  }
}

/** Aparta el descuento para una reserva. @returns true si lo consiguió. */
export async function reserveWelcomeBenefit(client: Client, userId: string, bookingId: string): Promise<boolean> {
  const result = await client.userBenefit.updateMany({
    where: {
      userId,
      code: WELCOME_BENEFIT_CODE,
      status: 'AVAILABLE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    data: { status: 'RESERVED', usedOnBookingId: bookingId },
  })
  return result.count === 1
}

/**
 * Pago aprobado: el descuento pasa a USADO.
 *
 * Acepta RESERVED para esta reserva, o AVAILABLE si el apartado se liberó
 * porque el cliente tardó en pagar. Si otra reserva lo gastó entretanto,
 * devuelve false: el pago ya está hecho y se respeta, pero queda registrado.
 */
export async function finalizeWelcomeBenefit(client: Client, userId: string, bookingId: string): Promise<boolean> {
  const result = await client.userBenefit.updateMany({
    where: {
      userId,
      code: WELCOME_BENEFIT_CODE,
      OR: [{ status: 'RESERVED', usedOnBookingId: bookingId }, { status: 'AVAILABLE' }],
    },
    data: { status: 'USED', usedAt: new Date(), usedOnBookingId: bookingId },
  })
  return result.count === 1
}

/**
 * Consume el beneficio de forma atómica.
 *
 * `updateMany` con `status: 'AVAILABLE'` en el WHERE es un update
 * condicional: la base de datos decide quién gana. Si dos peticiones llegan
 * a la vez, una actualiza 1 fila y la otra 0, y esta última falla.
 *
 * Debe llamarse dentro de la transacción de la reserva: si la reserva se
 * revierte, el consumo del descuento se revierte con ella.
 *
 * @returns true si este llamador consiguió consumirlo.
 */
export async function consumeWelcomeBenefit(
  client: Client,
  userId: string,
  bookingId: string,
): Promise<boolean> {
  const result = await client.userBenefit.updateMany({
    where: {
      userId,
      code: WELCOME_BENEFIT_CODE,
      status: 'AVAILABLE',
    },
    data: {
      status: 'USED',
      usedAt: new Date(),
      usedOnBookingId: bookingId,
    },
  })

  return result.count === 1
}
