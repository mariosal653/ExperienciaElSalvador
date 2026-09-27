import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cancelBookingAndLinks } from '@/lib/payments/process'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/bookings/<accessToken>/cancel — liberar una reserva apartada.
 *
 * Solo para «reserva ahora, paga después» sin pagar: no hay dinero que
 * devolver, así que el propio cliente puede soltar sus plazas para que
 * otros las usen. Una reserva pagada se cancela por WhatsApp, según la
 * política de cancelación.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ accessToken: string }> }) {
  const limit = rateLimit(`cancel:${clientIp(request)}`, 10, 60_000)
  if (!limit.ok) return NextResponse.json({ ok: false, code: 'tooManyRequests' }, { status: 429 })

  const { accessToken } = await params
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(accessToken)) {
    return NextResponse.json({ ok: false, code: 'bookingNotFound' }, { status: 404 })
  }

  const booking = await prisma.booking.findUnique({
    where: { accessToken },
    select: { id: true, userId: true, status: true, payLater: true },
  })
  if (!booking) return NextResponse.json({ ok: false, code: 'bookingNotFound' }, { status: 404 })

  if (!booking.payLater || booking.status !== 'PENDING_PAYMENT') {
    return NextResponse.json({ ok: false, code: 'notCancellable', status: booking.status }, { status: 409 })
  }

  await cancelBookingAndLinks(booking.id, booking.userId)
  return NextResponse.json({ ok: true })
}
