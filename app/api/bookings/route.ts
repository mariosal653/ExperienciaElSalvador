import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { consumeWelcomeBenefit, getUsableWelcomeBenefit, WELCOME_BENEFIT_CODE } from '@/lib/benefits'
import { calculatePrice, getExperiencePriceCents } from '@/lib/pricing'
import { experiences, matchesCriteria, parseLocalDate } from '@/lib/data'

/**
 * Reservas del usuario autenticado.
 *
 * GET   devuelve SOLO las reservas de quien pregunta.
 * POST  crea una reserva y, si se pide, consume el descuento.
 *
 * El precio se calcula ENTERAMENTE en el servidor a partir del catálogo.
 * El cuerpo de la petición no puede traer importes: si los trae, se
 * ignoran.
 */

const createSchema = z.object({
  experienceId: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalidDate'),
  people: z.number().int().min(1).max(20),
  applyWelcomeDiscount: z.boolean().optional().default(false),
})

/** Correlativo legible: RCS-2026-0001 */
async function nextBookingCode(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const year = new Date().getFullYear()
  const prefix = `RCS-${year}-`
  const last = await tx.booking.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  })
  const lastNumber = last ? Number.parseInt(last.code.slice(prefix.length), 10) : 0
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  // Filtrado por userId de la SESIÓN, nunca por un id que venga del cliente.
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { review: { select: { id: true } } },
  })

  return NextResponse.json({ bookings })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const userId = session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalidBody' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 422 })
  }

  const { experienceId, date, people, applyWelcomeDiscount } = parsed.data

  const experience = experiences.find((item) => item.id === experienceId)
  if (!experience) {
    return NextResponse.json({ error: 'experienceNotFound' }, { status: 404 })
  }

  // La fecha debe ser futura y la experiencia debe salir ese día.
  const parsedDate = parseLocalDate(date)
  if (!parsedDate) {
    return NextResponse.json({ error: 'invalidDate' }, { status: 422 })
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (parsedDate.getTime() < today.getTime()) {
    return NextResponse.json({ error: 'dateInPast' }, { status: 422 })
  }
  if (!matchesCriteria(experience, { destination: null, date, people })) {
    return NextResponse.json({ error: 'notAvailable' }, { status: 409 })
  }

  const unitPriceCents = getExperiencePriceCents(experienceId)
  if (unitPriceCents === null) {
    return NextResponse.json({ error: 'experienceNotFound' }, { status: 404 })
  }

  // ¿Se puede aplicar el descuento? Se comprueba ANTES de abrir la
  // transacción solo para calcular; quien manda es el update condicional.
  const benefit = applyWelcomeDiscount ? await getUsableWelcomeBenefit(userId) : null
  const discountPct = benefit?.percentage ?? 0

  const price = calculatePrice(unitPriceCents, people, discountPct)

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const code = await nextBookingCode(tx)

      const created = await tx.booking.create({
        data: {
          code,
          userId,
          experienceId: experience.id,
          experienceTitle: experience.title,
          experienceImage: experience.image,
          destination: experience.destination,
          date,
          people: price.people,
          unitPriceCents: price.unitPriceCents,
          subtotalCents: price.subtotalCents,
          discountCents: price.discountCents,
          totalCents: price.totalCents,
          discountPct: price.discountPct,
          benefitCode: discountPct > 0 ? WELCOME_BENEFIT_CODE : null,
          status: 'CONFIRMED',
        },
      })

      if (discountPct > 0) {
        // Update condicional: si otra petición ya lo gastó, esto devuelve
        // false y toda la transacción se revierte, reserva incluida.
        const consumed = await consumeWelcomeBenefit(tx, userId, created.id)
        if (!consumed) {
          throw new Error('BENEFIT_ALREADY_USED')
        }
      }

      return created
    })

    return NextResponse.json({ ok: true, booking }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'BENEFIT_ALREADY_USED') {
      return NextResponse.json({ error: 'benefitAlreadyUsed' }, { status: 409 })
    }
    return NextResponse.json({ error: 'serverError' }, { status: 500 })
  }
}
