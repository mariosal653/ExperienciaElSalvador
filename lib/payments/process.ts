import { prisma } from '../db'
import { finalizeWelcomeBenefit } from '../benefits'
import { issueTickets } from '../tickets'
import { sendConfirmationEmail } from '../email'
import { getSiteUrl } from '../site'
import { randomCode } from '../security'
import { getPayPalConfig, getPaymentConfig, type PaymentConfig, type PaymentMethod } from './config'
import { createPaymentLink, getTransaction, WompiError } from './wompi'
import { captureOrder, createOrder, PayPalError } from './paypal'

/**
 * Núcleo del flujo de pago. SOLO SERVIDOR.
 *
 *   PENDING_PAYMENT ──(pago validado)──► PAID ──(entradas emitidas)──► CONFIRMED
 *
 * Todo lo de aquí es IDEMPOTENTE: el webhook puede llegar dos veces, el
 * cliente puede recargar la página de retorno, y las dos cosas pueden
 * pasar a la vez. Lo garantizan la base de datos, no el código:
 *   - Payment: update condicional PENDING/DECLINED → APPROVED.
 *   - Payment.providerTransactionId único: una transacción, un pago.
 *   - Ticket @@unique([bookingId, number]): nunca entradas de más.
 *   - Booking: updates condicionales por estado.
 *   - Correo: se «reclama» con un update condicional antes de enviarlo.
 */

type ReadyConfig = Extract<PaymentConfig, { status: 'ready' }>
type WompiReadyConfig = Extract<ReadyConfig, { mode: 'sandbox' | 'production' }>

function log(event: string, detail: Record<string, unknown>) {
  console.info(`[payments] ${event}`, detail)
}

/* ------------------------------------------------------------------ */
/* Crear el cobro                                                      */
/* ------------------------------------------------------------------ */

export type BookingForPayment = {
  id: string
  code: string
  experienceTitle: string
  experienceImage: string | null
  date: string
  people: number
  totalCents: number
  currency: string
}

export class PaymentProviderError extends Error {}

/**
 * Crea el registro de pago y el enlace en la pasarela.
 * Devuelve la URL a la que hay que mandar al cliente.
 */
export async function createPaymentForBooking(
  booking: BookingForPayment,
  config: ReadyConfig,
  requestOrigin: string | null,
): Promise<{ checkoutUrl: string; reference: string }> {
  const site = getSiteUrl(requestOrigin)
  const reference = `${booking.code}-${randomCode(16)}`

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: config.mode === 'mock' ? 'mock' : 'wompi',
      environment: config.mode,
      amountCents: booking.totalCents,
      currency: booking.currency,
      reference,
    },
  })

  if (config.mode === 'mock') {
    const checkoutUrl = `/checkout/mock/${reference}`
    await prisma.payment.update({ where: { id: payment.id }, data: { checkoutUrl } })
    return { checkoutUrl, reference }
  }

  try {
    const imageUrl = booking.experienceImage?.startsWith('http')
      ? booking.experienceImage
      : booking.experienceImage
        ? `${site}${booking.experienceImage}`
        : undefined

    const link = await createPaymentLink(config, {
      reference,
      amountCents: booking.totalCents,
      productName: `${booking.experienceTitle} · ${booking.code}`,
      description: `${booking.experienceTitle} — ${booking.date} — ${booking.people} pax`,
      imageUrl,
      redirectUrl: `${site}/checkout/return?ref=${encodeURIComponent(reference)}`,
      webhookUrl: `${site}/api/payments/wompi/webhook`,
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerLinkId: link.linkId, checkoutUrl: link.checkoutUrl },
    })

    if (config.mode === 'production' && !link.isProduction) {
      // El negocio sigue en modo de pruebas en el panel de Wompi: el pago
      // no será real y approvePayment lo rechazará. Mejor saberlo ya.
      log('aviso: WOMPI_ENVIRONMENT=production pero el enlace no es productivo', { booking: booking.code })
    }

    return { checkoutUrl: link.checkoutUrl, reference }
  } catch (error) {
    const message = error instanceof WompiError ? error.message : error instanceof Error ? error.message : String(error)
    console.error('[payments] no se pudo crear el enlace de Wompi', { booking: booking.code, message })
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'DECLINED', failureReason: 'linkCreationFailed' },
    })
    throw new PaymentProviderError('linkCreationFailed')
  }
}

/* ------------------------------------------------------------------ */
/* Crear el cobro con PayPal                                           */
/* ------------------------------------------------------------------ */

/**
 * Crea el registro de pago y la orden en PayPal.
 *
 * Mismo contrato que `createPaymentForBooking`: devuelve la URL a la que
 * mandar al comprador. Lo que cambia es que PayPal cobra en un segundo
 * paso —la captura— y esa la dispara la página de retorno.
 *
 * El `environment` del pago se guarda como 'sandbox' o 'production' igual
 * que con Wompi, así `approvePayment` sigue rechazando por sí solo una
 * transacción de prueba en un entorno productivo.
 */
export async function createPayPalPaymentForBooking(
  booking: BookingForPayment,
  requestOrigin: string | null,
  locale: 'ES' | 'EN' = 'EN',
): Promise<{ checkoutUrl: string; reference: string }> {
  const paypal = getPayPalConfig()
  if (paypal.status !== 'ready') {
    console.error('[payments] PayPal no está configurado', { reason: paypal.reason })
    throw new PaymentProviderError('paypalNotConfigured')
  }

  const site = getSiteUrl(requestOrigin)
  const reference = `${booking.code}-${randomCode(16)}`

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: 'paypal',
      environment: paypal.config.mode,
      amountCents: booking.totalCents,
      currency: booking.currency,
      reference,
    },
  })

  try {
    const order = await createOrder(paypal.config, {
      reference,
      amountCents: booking.totalCents,
      currency: booking.currency,
      description: `${booking.experienceTitle} — ${booking.date} — ${booking.people} pax`,
      brandName: 'Experiences El Salvador',
      locale,
      returnUrl: `${site}/checkout/return?ref=${encodeURIComponent(reference)}&provider=paypal`,
      cancelUrl: `${site}/checkout/return?ref=${encodeURIComponent(reference)}&provider=paypal&cancelado=1`,
    })

    await prisma.payment.update({
      where: { id: payment.id },
      // providerLinkId guarda el id de la orden: es lo que hace falta para
      // capturar, y no depende de que la URL de retorno lo traiga.
      data: { providerLinkId: order.orderId, checkoutUrl: order.approveUrl },
    })

    return { checkoutUrl: order.approveUrl, reference }
  } catch (error) {
    const message = error instanceof PayPalError ? error.message : error instanceof Error ? error.message : String(error)
    console.error('[payments] no se pudo crear la orden de PayPal', { booking: booking.code, message })
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'DECLINED', failureReason: 'orderCreationFailed' },
    })
    throw new PaymentProviderError('orderCreationFailed')
  }
}

/**
 * Punto único de entrada del checkout: elige pasarela según lo que pidió
 * el comprador. Existe para que el endpoint no tenga que saber cómo
 * funciona cada una.
 */
export async function createCheckoutPayment(
  booking: BookingForPayment,
  method: PaymentMethod,
  requestOrigin: string | null,
  locale: 'ES' | 'EN' = 'EN',
): Promise<{ checkoutUrl: string; reference: string }> {
  if (method === 'paypal') {
    return createPayPalPaymentForBooking(booking, requestOrigin, locale)
  }

  const config = getPaymentConfig()
  if (config.status !== 'ready') throw new PaymentProviderError('paymentsDisabled')
  return createPaymentForBooking(booking, config, requestOrigin)
}

/* ------------------------------------------------------------------ */
/* Aprobar                                                             */
/* ------------------------------------------------------------------ */

export type ApprovalInput = {
  paymentId: string
  transactionId: string
  amountCents: number
  authorizationCode: string | null
  /** Según la pasarela: false = transacción de prueba. */
  isReal: boolean
  source: 'webhook' | 'redirect' | 'mock'
}

export type ApprovalResult =
  | { outcome: 'approved' | 'alreadyProcessed'; bookingId: string }
  | { outcome: 'rejected'; reason: string }

class AlreadyProcessed extends Error {}

/**
 * Marca un pago como aprobado. Solo debe llamarse con datos ya validados
 * contra la pasarela (webhook con firma correcta + consulta a la API, o
 * consulta directa a la API). NUNCA con lo que diga el navegador.
 */
export async function approvePayment(input: ApprovalInput): Promise<ApprovalResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { booking: { select: { id: true, userId: true, benefitCode: true } } },
  })
  if (!payment) return { outcome: 'rejected', reason: 'paymentNotFound' }

  if (payment.status === 'APPROVED') {
    if (payment.providerTransactionId !== input.transactionId) {
      // Otra transacción sobre un pago ya cobrado: posible doble cobro en
      // la pasarela. No se toca nada y se deja rastro para revisarlo.
      log('segunda transacción sobre un pago ya aprobado', {
        payment: payment.id,
        existing: payment.providerTransactionId,
        incoming: input.transactionId,
      })
    }
    await finalizeBooking(payment.bookingId)
    return { outcome: 'alreadyProcessed', bookingId: payment.bookingId }
  }

  if (payment.status === 'REFUNDED') return { outcome: 'rejected', reason: 'paymentRefunded' }

  // El importe cobrado debe ser EXACTAMENTE el calculado en el servidor.
  if (input.amountCents !== payment.amountCents) {
    await prisma.payment.update({ where: { id: payment.id }, data: { failureReason: 'amountMismatch' } })
    log('importe no coincide', { payment: payment.id, expected: payment.amountCents, received: input.amountCents })
    return { outcome: 'rejected', reason: 'amountMismatch' }
  }

  // En producción no se aceptan transacciones de prueba.
  if (payment.environment === 'production' && !input.isReal) {
    await prisma.payment.update({ where: { id: payment.id }, data: { failureReason: 'testTransactionInProduction' } })
    log('transacción de prueba rechazada en producción', { payment: payment.id })
    return { outcome: 'rejected', reason: 'testTransactionInProduction' }
  }

  const now = new Date()

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: { in: ['PENDING', 'DECLINED'] } },
        data: {
          status: 'APPROVED',
          providerTransactionId: input.transactionId,
          authorizationCode: input.authorizationCode,
          isRealTransaction: input.isReal,
          approvedAt: now,
          failureReason: null,
        },
      })
      if (updated.count === 0) throw new AlreadyProcessed()

      // CANCELLED incluido: si el cliente pagó después de que venciera el
      // apartado, el dinero ya se cobró y la reserva se respeta.
      await tx.booking.updateMany({
        where: { id: payment.bookingId, status: { in: ['PENDING_PAYMENT', 'CANCELLED'] } },
        data: { status: 'PAID', paidAt: now, cancelledAt: null },
      })

      if (payment.booking.userId && payment.booking.benefitCode) {
        const used = await finalizeWelcomeBenefit(tx, payment.booking.userId, payment.bookingId)
        if (!used) log('el descuento ya se había usado en otra reserva', { booking: payment.bookingId })
      }
    })
  } catch (error) {
    if (error instanceof AlreadyProcessed) {
      await finalizeBooking(payment.bookingId)
      return { outcome: 'alreadyProcessed', bookingId: payment.bookingId }
    }
    if (isUniqueViolation(error)) {
      // Esa transacción ya está registrada en OTRO pago: reutilización.
      log('transacción ya registrada en otro pago', { payment: payment.id, transaction: input.transactionId })
      return { outcome: 'rejected', reason: 'transactionAlreadyUsed' }
    }
    throw error
  }

  log('pago aprobado', { payment: payment.id, source: input.source })
  await finalizeBooking(payment.bookingId)
  return { outcome: 'approved', bookingId: payment.bookingId }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002'
}

/** Intento rechazado. La reserva sigue pendiente: se puede reintentar. */
export async function declinePayment(paymentId: string, reason: string) {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: 'PENDING' },
    data: { status: 'DECLINED', failureReason: reason.slice(0, 200) },
  })
}

/* ------------------------------------------------------------------ */
/* Entradas + confirmación                                             */
/* ------------------------------------------------------------------ */

/**
 * Lleva una reserva PAGADA a CONFIRMADA: emite las entradas que falten,
 * cambia el estado y envía el correo una sola vez.
 *
 * Es seguro llamarla siempre: si la reserva no tiene un pago aprobado, no
 * hace nada. Así ninguna entrada existe sin cobro.
 */
export async function finalizeBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: { where: { status: 'APPROVED' }, select: { id: true } } },
  })
  if (!booking || booking.payments.length === 0) return
  if (booking.status !== 'PAID' && booking.status !== 'CONFIRMED') return

  await issueTickets(prisma, booking)

  if (booking.status === 'PAID') {
    await prisma.booking.updateMany({
      where: { id: booking.id, status: 'PAID' },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    })
  }

  await sendConfirmationOnce(booking.id)
}

async function sendConfirmationOnce(bookingId: string) {
  // Reclamar el envío ANTES de hacerlo: si dos procesos llegan a la vez,
  // solo uno actualiza la fila y solo ese envía.
  const claim = await prisma.booking.updateMany({
    where: { id: bookingId, status: 'CONFIRMED', confirmationEmailSentAt: null },
    data: { confirmationEmailSentAt: new Date() },
  })
  if (claim.count === 0) return

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return

  const result = await sendConfirmationEmail({
    to: booking.customerEmail,
    customerName: booking.customerName,
    bookingCode: booking.code,
    experienceTitle: booking.experienceTitle,
    date: booking.date,
    people: booking.people,
    totalCents: booking.totalCents,
    currency: booking.currency,
    bookingUrl: `${getSiteUrl()}/booking/${booking.accessToken}`,
    isTest: booking.isTest,
    locale: booking.locale,
  })

  if (!result.sent) {
    // Se libera para que un intento posterior (otro aviso de la pasarela,
    // la página de retorno) pueda enviarlo.
    await prisma.booking.update({ where: { id: bookingId }, data: { confirmationEmailSentAt: null } })
  }
}

/* ------------------------------------------------------------------ */
/* Captura de PayPal                                                   */
/* ------------------------------------------------------------------ */

export type PayPalCaptureOutcome =
  | ApprovalResult
  | { outcome: 'declined'; reason: string }
  | { outcome: 'pending'; reason: string }
  | { outcome: 'unavailable' }

/**
 * Cobra la orden de PayPal asociada a un pago y registra el resultado.
 *
 * ESTO es lo que convierte una reserva en pagada. Volver de PayPal no
 * basta: solo significa que el comprador pulsó «Pagar ahora». Aquí se
 * llama a la API, se comprueba que la captura está COMPLETED y que el
 * importe coincide, y solo entonces se aprueba.
 *
 * Idempotente por partida doble:
 *   - en PayPal, con la cabecera PayPal-Request-Id;
 *   - aquí, porque `approvePayment` usa updates condicionales y el id de
 *     la captura es único en la tabla de pagos.
 * Recargar la página de retorno no cobra dos veces.
 */
export async function capturePayPalPayment(paymentId: string): Promise<PayPalCaptureOutcome> {
  const paypal = getPayPalConfig()
  if (paypal.status !== 'ready') return { outcome: 'unavailable' }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, provider: true, status: true, providerLinkId: true, amountCents: true, reference: true, bookingId: true },
  })
  if (!payment || payment.provider !== 'paypal') return { outcome: 'unavailable' }

  // Ya cobrado: no se vuelve a llamar a PayPal. Se rematan las entradas y
  // el correo por si quedaron a medias.
  if (payment.status === 'APPROVED') {
    await finalizeBooking(payment.bookingId)
    return { outcome: 'alreadyProcessed', bookingId: payment.bookingId }
  }

  if (!payment.providerLinkId) {
    log('pago de PayPal sin orden asociada', { payment: payment.id })
    return { outcome: 'declined', reason: 'noOrder' }
  }

  let result
  try {
    result = await captureOrder(paypal.config, payment.providerLinkId, `capture-${payment.reference}`)
  } catch (error) {
    // Un fallo de red o un 5xx de PayPal NO es un pago rechazado: puede
    // haberse cobrado. Se deja PENDING para reintentarlo.
    console.error('[payments] no se pudo capturar la orden de PayPal', {
      payment: payment.id,
      message: error instanceof Error ? error.message : String(error),
    })
    return { outcome: 'unavailable' }
  }

  if (result.outcome === 'declined') {
    await declinePayment(payment.id, `paypal:${result.reason}`)
    return { outcome: 'declined', reason: result.reason }
  }

  if (result.outcome === 'pending') {
    // PayPal retuvo el cobro para revisarlo. Ni se confirma ni se
    // rechaza: queda pendiente y se resuelve al volver a consultar.
    log('captura de PayPal pendiente de revisión', { payment: payment.id, reason: result.reason })
    return { outcome: 'pending', reason: result.reason }
  }

  return approvePayment({
    paymentId: payment.id,
    transactionId: result.captureId,
    amountCents: result.amountCents,
    authorizationCode: null,
    // En sandbox el dinero no es real; en live sí. El entorno del pago ya
    // se guardó al crearlo, así que approvePayment puede compararlos.
    isReal: paypal.config.mode === 'production',
    source: 'redirect',
  })
}

/* ------------------------------------------------------------------ */
/* Conciliación con la API de Wompi                                    */
/* ------------------------------------------------------------------ */

/**
 * Pregunta a Wompi por una transacción y actúa según lo que diga Wompi,
 * no según lo que traiga la URL. Lo usa la página de retorno.
 */
export async function reconcileWompiTransaction(
  paymentId: string,
  transactionId: string,
  source: 'webhook' | 'redirect' = 'redirect',
): Promise<ApprovalResult | { outcome: 'declined' } | { outcome: 'unavailable' }> {
  const config = getPaymentConfig()
  if (config.status !== 'ready' || config.mode === 'mock') return { outcome: 'unavailable' }

  let transaction
  try {
    transaction = await getTransaction(config as WompiReadyConfig, transactionId)
  } catch (error) {
    console.error('[payments] no se pudo consultar la transacción', {
      transactionId,
      message: error instanceof Error ? error.message : String(error),
    })
    return { outcome: 'unavailable' }
  }

  if (!transaction.approved) {
    await declinePayment(paymentId, transaction.message ?? 'declined')
    return { outcome: 'declined' }
  }

  return approvePayment({
    paymentId,
    transactionId: transaction.transactionId,
    amountCents: transaction.amountCents,
    authorizationCode: transaction.authorizationCode,
    isReal: transaction.isReal,
    source,
  })
}
