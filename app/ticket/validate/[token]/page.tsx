import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { looksLikeTicketToken, type TicketValidity } from '@/lib/tickets'
import { getPaymentConfig } from '@/lib/payments/config'
import { TicketValidation } from '@/components/booking/ticket-validation'

/**
 * Lo que abre el QR de una entrada.
 *
 * Muestra SOLO: marca, experiencia, fecha, id de la entrada y estado. Ni
 * nombre, ni correo, ni importe: cualquiera que vea el QR (una foto en
 * redes, por ejemplo) no obtiene datos personales.
 *
 * Abrir esta página NO consume la entrada. Marcarla como usada es una
 * acción aparte del personal, con clave (POST /api/tickets/{token}/redeem).
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ticket',
  robots: { index: false, follow: false },
}

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const ticket = looksLikeTicketToken(token)
    ? await prisma.ticket.findUnique({
        where: { token },
        include: { booking: { select: { status: true, isTest: true, experienceTitle: true, people: true } } },
      })
    : null

  const config = getPaymentConfig()
  const productionMode = config.status === 'ready' && config.mode === 'production'

  let status: TicketValidity = 'INVALID'
  if (ticket) {
    const bookingOk = ticket.booking.status === 'CONFIRMED' || ticket.booking.status === 'COMPLETED'
    const testBlocked = ticket.booking.isTest && productionMode
    status = bookingOk && !testBlocked ? ticket.status : 'INVALID'
  }

  return (
    <TicketValidation
      token={token}
      status={status}
      ticket={
        ticket
          ? {
              code: ticket.code,
              number: ticket.number,
              people: ticket.booking.people,
              experienceTitle: ticket.booking.experienceTitle,
              date: ticket.date,
              usedAt: ticket.usedAt?.toISOString() ?? null,
              isTest: ticket.booking.isTest,
            }
          : null
      }
      staffEnabled={Boolean(process.env.TICKET_VALIDATION_KEY?.trim())}
    />
  )
}
