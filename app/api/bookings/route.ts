import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/bookings — reservas del usuario autenticado. SOLO las suyas.
 *
 * Aquí había también un POST que creaba reservas CONFIRMADAS sin cobrar
 * nada. Se eliminó: ahora toda reserva nace en POST /api/checkout como
 * pendiente de pago y solo se confirma cuando la pasarela valida el cobro.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  // Filtrado por userId de la SESIÓN, nunca por un id que venga del cliente.
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      code: true,
      experienceId: true,
      experienceTitle: true,
      date: true,
      people: true,
      totalCents: true,
      currency: true,
      status: true,
      createdAt: true,
      review: { select: { id: true } },
    },
  })

  return NextResponse.json({ bookings })
}
