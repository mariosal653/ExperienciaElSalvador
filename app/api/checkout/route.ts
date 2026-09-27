import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cancelUnpaidBooking, checkoutSchema, createPendingBooking } from '@/lib/checkout'
import { availablePaymentMethods, getPaymentConfig } from '@/lib/payments/config'
import { createCheckoutPayment, PaymentProviderError } from '@/lib/payments/process'
import { getSiteUrl, originOf } from '@/lib/site'
import { sendHoldEmail } from '@/lib/email'
import { formatDeadline, payLaterDeadline } from '@/lib/pay-later'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/checkout — compra sin registro.
 *
 * 1. Valida (esquema + reglas de negocio) en el servidor.
 * 2. Crea la reserva en PENDING_PAYMENT, apartando plazas 30 minutos.
 * 3. Crea el cobro en la pasarela elegida (Wompi o PayPal) y devuelve su
 *    URL. Las dos se configuran por separado: basta con que haya una.
 *
 * NO confirma nada: la reserva pasa a PAID solo cuando el pago se valida
 * con la pasarela —webhook o consulta a su API en Wompi, captura en
 * servidor en PayPal—. Tampoco emite entradas.
 *
 * PAGAR DESPUÉS (`payLater: true`): se salta el paso 3. La reserva queda
 * apartada hasta 48 h antes de la salida y el cliente paga desde
 * /booking/<accessToken> (POST /api/bookings/<accessToken>/pay).
 *
 * RESPUESTAS
 *   201 { ok: true, bookingCode, accessToken, checkoutUrl, method }
 *   201 { ok: true, bookingCode, accessToken, payLater: true }
 *   200 { ok: true, ..., reused: true }   mismo envío repetido
 *   400 invalidBody · 422 validation / invalidCustomer / fecha
 *   409 soldOut / benefitUnavailable · 429 tooManyRequests
 *   502 paymentProviderUnavailable · 503 paymentsDisabled
 */

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const limit = rateLimit(`checkout:${clientIp(request)}`, 12, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, code: 'tooManyRequests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  // Basta con que haya UNA pasarela disponible: Wompi y PayPal se
  // configuran por separado y el comprador elige entre las que existan.
  const methods = availablePaymentMethods()
  if (!methods.any) {
    console.error('[checkout] pagos desactivados: no hay ninguna pasarela configurada')
    return NextResponse.json({ ok: false, code: 'paymentsDisabled' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, code: 'invalidBody' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))]
    return NextResponse.json({ ok: false, code: 'validation', fields }, { status: 422 })
  }

  // La sesión es OPCIONAL: sin ella se compra igual. Con ella, la reserva
  // aparece también en el perfil y se puede usar el descuento.
  const session = await auth()
  const userId = session?.user?.id ?? null

  // Se respeta lo que pidió el comprador solo si esa pasarela existe; si
  // no, se usa la otra. Así un formulario en caché con el método antiguo
  // no deja la compra bloqueada.
  const requested = parsed.data.paymentMethod
  const method = methods[requested].available ? requested : requested === 'paypal' ? 'wompi' : 'paypal'

  // Una reserva es de prueba salvo que la pasarela elegida esté cobrando
  // de verdad: mock y sandbox no mueven dinero.
  const wompi = getPaymentConfig()
  const wompiLive = wompi.status === 'ready' && wompi.mode === 'production'
  const paypalLive = methods.paypal.mode === 'production'
  // Pagando después todavía no se sabe con qué pasarela: es real si alguna
  // de las disponibles cobra de verdad.
  const isTest = parsed.data.payLater
    ? !(wompiLive || paypalLive)
    : method === 'paypal'
      ? !paypalLive
      : !wompiLive

  const result = await createPendingBooking(parsed.data, { userId, isTest })

  if (!result.ok) {
    const { status, ...rest } = result.failure
    return NextResponse.json({ ok: false, ...rest }, { status })
  }

  const booking = result.booking

  // El mismo envío ya terminó su recorrido (pagado, o cancelado porque no
  // se pudo crear el cobro). No se crea otro cobro sobre esa reserva.
  if (booking.reused && booking.status !== 'PENDING_PAYMENT') {
    return NextResponse.json(
      { ok: false, code: booking.status === 'CANCELLED' ? 'bookingCancelled' : 'alreadyPaid', accessToken: booking.status === 'CANCELLED' ? undefined : booking.accessToken },
      { status: 409 },
    )
  }

  // Pagar después: no se crea ningún cobro. Se avisa por correo con el
  // enlace a la reserva, desde donde podrá pagar hasta el plazo.
  if (booking.payLater) {
    if (!booking.reused) {
      const deadline = payLaterDeadline(booking.date)
      const locale = parsed.data.locale
      await sendHoldEmail({
        to: parsed.data.customer.email.trim().toLowerCase(),
        customerName: parsed.data.customer.name,
        bookingCode: booking.code,
        experienceTitle: booking.experienceTitle,
        date: booking.date,
        people: booking.people,
        totalCents: booking.totalCents,
        currency: booking.currency,
        bookingUrl: `${getSiteUrl(originOf(request))}/booking/${booking.accessToken}`,
        isTest,
        locale,
        deadlineLabel: deadline ? formatDeadline(deadline, locale) : booking.date,
      }).catch((error) => console.error('[checkout] no se pudo enviar el aviso de reserva apartada', error))
    }
    return NextResponse.json(
      { ok: true, bookingCode: booking.code, accessToken: booking.accessToken, payLater: true, reused: booking.reused },
      { status: booking.reused ? 200 : 201 },
    )
  }

  // Reintento del mismo envío con un cobro ya creado: se devuelve tal cual.
  if (booking.reused && booking.pendingCheckoutUrl) {
    return NextResponse.json({
      ok: true,
      reused: true,
      bookingCode: booking.code,
      accessToken: booking.accessToken,
      checkoutUrl: booking.pendingCheckoutUrl,
      method,
    })
  }

  try {
    const payment = await createCheckoutPayment(booking, method, originOf(request), parsed.data.locale)
    return NextResponse.json(
      {
        ok: true,
        bookingCode: booking.code,
        accessToken: booking.accessToken,
        checkoutUrl: payment.checkoutUrl,
        method,
      },
      { status: 201 },
    )
  } catch (error) {
    // Sin enlace de pago la reserva no sirve: se cancela y se liberan las
    // plazas y el descuento apartados.
    await cancelUnpaidBooking(booking.id, userId)
    if (error instanceof PaymentProviderError) {
      return NextResponse.json({ ok: false, code: 'paymentProviderUnavailable' }, { status: 502 })
    }
    console.error('[checkout] error inesperado', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, code: 'internalError' }, { status: 500 })
  }
}
