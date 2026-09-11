import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { safeEqual } from '@/lib/security'
import { looksLikeTicketToken } from '@/lib/tickets'
import { todayInElSalvador } from '@/lib/availability'
import { getPaymentConfig } from '@/lib/payments/config'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/tickets/{token}/redeem — marcar una entrada como USADA.
 *
 * Solo para el personal: exige la clave TICKET_VALIDATION_KEY en la
 * cabecera `x-validation-key`. Abrir la URL del QR (GET) nunca consume la
 * entrada: las vistas previas de WhatsApp o del correo la abrirían solas.
 *
 * El cambio ACTIVE → USED es un update condicional: dos lectores que
 * escanean la misma entrada a la vez no pueden darla por buena dos veces.
 */

export const dynamic = 'force-dynamic'

const schema = z.object({ allowOtherDate: z.boolean().optional().default(false) })

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const limit = rateLimit(`redeem:${clientIp(request)}`, 30, 60_000)
  if (!limit.ok) return NextResponse.json({ ok: false, code: 'tooManyRequests' }, { status: 429 })

  const expectedKey = process.env.TICKET_VALIDATION_KEY?.trim()
  if (!expectedKey) {
    return NextResponse.json({ ok: false, code: 'validationDisabled' }, { status: 503 })
  }

  const providedKey = request.headers.get('x-validation-key')?.trim() ?? ''
  if (!safeEqual(providedKey, expectedKey)) {
    return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 })
  }

  const { token } = await params
  if (!looksLikeTicketToken(token)) {
    return NextResponse.json({ ok: false, code: 'invalid' }, { status: 404 })
  }

  const body = schema.safeParse(await request.json().catch(() => ({})))
  const allowOtherDate = body.success ? body.data.allowOtherDate : false

  const ticket = await prisma.ticket.findUnique({
    where: { token },
    include: { booking: { select: { status: true, isTest: true } } },
  })
  if (!ticket) return NextResponse.json({ ok: false, code: 'invalid' }, { status: 404 })

  if (ticket.booking.status !== 'CONFIRMED' && ticket.booking.status !== 'COMPLETED') {
    return NextResponse.json({ ok: false, code: 'bookingNotConfirmed' }, { status: 409 })
  }

  // Con Wompi en producción, una entrada de prueba no da acceso.
  const config = getPaymentConfig()
  if (ticket.booking.isTest && config.status === 'ready' && config.mode === 'production') {
    return NextResponse.json({ ok: false, code: 'testTicket' }, { status: 409 })
  }

  if (ticket.status === 'USED') {
    return NextResponse.json({ ok: false, code: 'alreadyUsed', usedAt: ticket.usedAt }, { status: 409 })
  }
  if (ticket.status === 'CANCELLED') {
    return NextResponse.json({ ok: false, code: 'cancelled' }, { status: 409 })
  }

  const today = todayInElSalvador()
  if (ticket.date !== today && !allowOtherDate) {
    return NextResponse.json({ ok: false, code: 'wrongDate', ticketDate: ticket.date, today }, { status: 409 })
  }

  const now = new Date()
  const updated = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: 'ACTIVE' },
    data: { status: 'USED', usedAt: now },
  })
  if (updated.count === 0) {
    return NextResponse.json({ ok: false, code: 'alreadyUsed' }, { status: 409 })
  }

  return NextResponse.json({ ok: true, status: 'USED', usedAt: now })
}
