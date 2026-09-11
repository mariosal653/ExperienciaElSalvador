import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cancelUnpaidBooking, checkoutSchema, createPendingBooking } from '@/lib/checkout'
import { getPaymentConfig } from '@/lib/payments/config'
import { createPaymentForBooking, PaymentProviderError } from '@/lib/payments/process'
import { originOf } from '@/lib/site'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/checkout — compra sin registro.
 *
 * 1. Valida (esquema + reglas de negocio) en el servidor.
 * 2. Crea la reserva en PENDING_PAYMENT, apartando plazas 30 minutos.
 * 3. Crea el cobro en la pasarela y devuelve su URL.
 *
 * NO confirma nada: la reserva pasa a PAID solo cuando el pago se valida
 * con la pasarela (webhook o consulta a su API). Tampoco emite entradas.
 *
 * RESPUESTAS
 *   201 { ok: true, bookingCode, accessToken, checkoutUrl, mode }
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

  const config = getPaymentConfig()
  if (config.status !== 'ready') {
    console.error('[checkout] pagos desactivados', { reason: config.reason })
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

  const result = await createPendingBooking(parsed.data, {
    userId,
    isTest: config.mode !== 'production',
  })

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

  // Reintento del mismo envío con un cobro ya creado: se devuelve tal cual.
  if (booking.reused && booking.pendingCheckoutUrl) {
    return NextResponse.json({
      ok: true,
      reused: true,
      bookingCode: booking.code,
      accessToken: booking.accessToken,
      checkoutUrl: booking.pendingCheckoutUrl,
      mode: config.mode,
    })
  }

  try {
    const payment = await createPaymentForBooking(booking, config, originOf(request))
    return NextResponse.json(
      {
        ok: true,
        bookingCode: booking.code,
        accessToken: booking.accessToken,
        checkoutUrl: payment.checkoutUrl,
        mode: config.mode,
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
