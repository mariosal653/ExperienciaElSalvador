import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { availablePaymentMethods, getPaymentConfig } from '@/lib/payments/config'
import { createCheckoutPayment, PaymentProviderError } from '@/lib/payments/process'
import { originOf } from '@/lib/site'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/bookings/<accessToken>/pay — pagar una reserva apartada.
 *
 * Es el segundo paso de «reserva ahora, paga después»: la reserva ya
 * existe en PENDING_PAYMENT con sus plazas guardadas hasta `holdExpiresAt`.
 * Aquí solo se crea el cobro en la pasarela; confirmar sigue siendo cosa
 * del webhook o de la captura en servidor, igual que en el checkout.
 *
 * La llave de acceso (256 bits) es la autorización: quien la tiene es el
 * dueño de la reserva, como en /booking/<accessToken>.
 *
 * RESPUESTAS
 *   200 { ok: true, checkoutUrl, method }
 *   404 bookingNotFound · 409 notPayable (pagada, cancelada o vencida)
 *   429 tooManyRequests · 502 paymentProviderUnavailable · 503 paymentsDisabled
 */

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  method: z.enum(['wompi', 'paypal']).optional().default('wompi'),
  locale: z.enum(['ES', 'EN']).optional().default('EN'),
})

/** Un enlace pendiente más reciente que esto se reutiliza en vez de crear otro. */
const REUSE_LINK_MS = 20 * 60_000

export async function POST(request: Request, { params }: { params: Promise<{ accessToken: string }> }) {
  const limit = rateLimit(`pay:${clientIp(request)}`, 12, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, code: 'tooManyRequests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const { accessToken } = await params
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(accessToken)) {
    return NextResponse.json({ ok: false, code: 'bookingNotFound' }, { status: 404 })
  }

  let raw: unknown = {}
  try {
    raw = await request.json()
  } catch {
    // Cuerpo vacío: valores por defecto.
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ ok: false, code: 'validation' }, { status: 422 })

  const methods = availablePaymentMethods()
  if (!methods.any) return NextResponse.json({ ok: false, code: 'paymentsDisabled' }, { status: 503 })

  const booking = await prisma.booking.findUnique({
    where: { accessToken },
    include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  if (!booking) return NextResponse.json({ ok: false, code: 'bookingNotFound' }, { status: 404 })

  const now = new Date()
  if (booking.status !== 'PENDING_PAYMENT' || !booking.holdExpiresAt || booking.holdExpiresAt <= now) {
    return NextResponse.json({ ok: false, code: 'notPayable', status: booking.status }, { status: 409 })
  }

  const requested = parsed.data.method
  const method = methods[requested].available ? requested : requested === 'paypal' ? 'wompi' : 'paypal'

  // Doble clic o vuelta atrás: si hay un enlace recién creado en la misma
  // pasarela, se reutiliza en lugar de abrir otro cobro.
  const last = booking.payments[0]
  const sameProvider = last && (method === 'paypal' ? last.provider === 'paypal' : last.provider !== 'paypal')
  if (last && sameProvider && last.status === 'PENDING' && last.checkoutUrl && now.getTime() - last.createdAt.getTime() < REUSE_LINK_MS) {
    return NextResponse.json({ ok: true, checkoutUrl: last.checkoutUrl, method, reused: true })
  }

  // Si la pasarela elegida no cobra de verdad, la reserva pasa a ser de
  // prueba: sus entradas no deben servir para entrar.
  const wompi = getPaymentConfig()
  const live = method === 'paypal' ? methods.paypal.mode === 'production' : wompi.status === 'ready' && wompi.mode === 'production'
  if (!live && !booking.isTest) {
    await prisma.booking.update({ where: { id: booking.id }, data: { isTest: true } })
  }

  try {
    const payment = await createCheckoutPayment(booking, method, originOf(request), parsed.data.locale)
    return NextResponse.json({ ok: true, checkoutUrl: payment.checkoutUrl, method })
  } catch (error) {
    // A diferencia del checkout, la reserva NO se cancela: sigue apartada
    // hasta su plazo y el cliente puede reintentar.
    if (error instanceof PaymentProviderError) {
      return NextResponse.json({ ok: false, code: 'paymentProviderUnavailable' }, { status: 502 })
    }
    console.error('[pay] error inesperado', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, code: 'internalError' }, { status: 500 })
  }
}
