import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { finalizeBooking } from '@/lib/payments/process'
import { ticketQrSvg, ticketUrl } from '@/lib/tickets'
import { publicPaymentInfo } from '@/lib/payments/config'
import { BookingView } from '@/components/booking/booking-view'

/**
 * Reserva y entradas del cliente, accesibles con su llave (sin cuenta).
 *
 * La llave es de 256 bits y la página no se indexa ni manda la URL como
 * referer a otros sitios (cabeceras en next.config.mjs).
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your booking',
  robots: { index: false, follow: false },
}

export default async function BookingPage({ params }: { params: Promise<{ accessToken: string }> }) {
  const { accessToken } = await params
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(accessToken)) notFound()

  let booking = await prisma.booking.findUnique({ where: { accessToken }, select: { id: true, status: true } })
  if (!booking) notFound()

  // Pagada pero sin entradas todavía (p. ej. el proceso se cortó entre los
  // dos pasos): se completa aquí. Es idempotente.
  if (booking.status === 'PAID') {
    await finalizeBooking(booking.id)
  }

  const full = await prisma.booking.findUnique({
    where: { accessToken },
    include: {
      tickets: { orderBy: { number: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!full) notFound()

  const showTickets = full.status === 'CONFIRMED' || full.status === 'COMPLETED'
  const tickets = showTickets
    ? await Promise.all(
        full.tickets.map(async (ticket) => ({
          code: ticket.code,
          number: ticket.number,
          status: ticket.status,
          usedAt: ticket.usedAt?.toISOString() ?? null,
          url: ticketUrl(ticket.token),
          qrSvg: await ticketQrSvg(ticket.token),
        })),
      )
    : []

  const lastPayment = full.payments[0] ?? null

  return (
    <BookingView
      booking={{
        code: full.code,
        status: full.status,
        experienceId: full.experienceId,
        experienceTitle: full.experienceTitle,
        experienceImage: full.experienceImage,
        destination: full.destination,
        date: full.date,
        people: full.people,
        unitPriceCents: full.unitPriceCents,
        subtotalCents: full.subtotalCents,
        discountCents: full.discountCents,
        totalCents: full.totalCents,
        currency: full.currency,
        customerName: full.customerName,
        customerEmail: full.customerEmail,
        isTest: full.isTest,
        holdExpiresAt: full.holdExpiresAt?.toISOString() ?? null,
        emailSent: full.confirmationEmailSentAt !== null,
      }}
      payment={
        lastPayment
          ? { status: lastPayment.status, checkoutUrl: lastPayment.checkoutUrl, failureReason: lastPayment.failureReason }
          : null
      }
      paymentMode={publicPaymentInfo().mode}
      tickets={tickets}
    />
  )
}
