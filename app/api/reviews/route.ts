import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getReviews } from '@/lib/reviews'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const reviewSchema = z.object({
  bookingId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(800),
})

/**
 * Reseñas: propias (base de datos) y de las plataformas conectadas.
 *
 * Corre en el servidor para que la clave de Google no salga nunca al
 * navegador.
 *
 * No se cachea: incluye las opiniones propias, que cambian en cuanto un
 * usuario publica la suya. El proveedor de Google mantiene su propia
 * revalidación de una hora dentro de su `fetch`.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('locale') === 'ES' ? 'es' : 'en'

  const payload = await getReviews(requested)

  return NextResponse.json(payload)
}

/**
 * Publicar una opinión.
 *
 * REGLA: solo se puede opinar sobre una reserva PROPIA y COMPLETADA, y una
 * sola vez. Quien nunca hizo la experiencia no puede opinar sobre ella.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalidBody' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 422 })
  }

  const { bookingId, rating, comment } = parsed.data

  // La reserva debe ser de quien pregunta: se busca por id Y por userId.
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: session.user.id },
    include: { review: { select: { id: true } } },
  })

  if (!booking) {
    return NextResponse.json({ error: 'bookingNotFound' }, { status: 404 })
  }
  if (booking.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'bookingNotCompleted' }, { status: 409 })
  }
  if (booking.review) {
    return NextResponse.json({ error: 'alreadyReviewed' }, { status: 409 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  })

  try {
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        bookingId: booking.id,
        authorName: user?.name ?? 'Viajero',
        authorImage: user?.image ?? null,
        experienceId: booking.experienceId,
        experienceTitle: booking.experienceTitle,
        rating,
        comment: comment.trim(),
        verified: true,
        isSeed: false,
        published: true,
      },
    })
    return NextResponse.json({ ok: true, review }, { status: 201 })
  } catch {
    // El unique de bookingId cubre la carrera de dos envíos simultáneos.
    return NextResponse.json({ error: 'alreadyReviewed' }, { status: 409 })
  }
}
