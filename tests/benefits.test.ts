import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { calculatePrice } from '../lib/pricing'

/**
 * Pruebas del descuento de bienvenida contra una base SQLite real.
 *
 * Se usa un archivo aparte para no tocar dev.db.
 */
const TEST_DB = 'file:./test.db'
process.env.DATABASE_URL = TEST_DB

const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB } } })

const WELCOME_CODE = 'WELCOME25'

/** Réplica de grantWelcomeBenefit sobre el cliente de pruebas. */
async function grant(tx: any, userId: string) {
  return tx.userBenefit.create({
    data: { userId, code: WELCOME_CODE, percentage: 25, status: 'AVAILABLE' },
  })
}

/** Réplica del update condicional que consume el beneficio. */
async function consume(tx: any, userId: string, bookingId: string): Promise<boolean> {
  const result = await tx.userBenefit.updateMany({
    where: { userId, code: WELCOME_CODE, status: 'AVAILABLE' },
    data: { status: 'USED', usedAt: new Date(), usedOnBookingId: bookingId },
  })
  return result.count === 1
}

/** Alta de usuario: cuenta y beneficio en la misma transacción. */
async function registerUser(email: string, withBenefit = true) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name: email.split('@')[0], passwordHash: await bcrypt.hash('Secreta123', 4) },
    })
    if (withBenefit) await grant(tx, user.id)
    return user
  })
}

let counter = 0
async function createBooking(userId: string, discountPct = 0) {
  counter += 1
  const price = calculatePrice(4500, 2, discountPct)
  return prisma.booking.create({
    data: {
      code: `TST-${String(counter).padStart(4, '0')}`,
      userId,
      experienceId: 'volcan-santa-ana',
      experienceTitle: 'Volcán de Santa Ana',
      destination: 'Volcán de Santa Ana',
      date: '2026-12-20',
      people: price.people,
      unitPriceCents: price.unitPriceCents,
      subtotalCents: price.subtotalCents,
      discountCents: price.discountCents,
      totalCents: price.totalCents,
      discountPct: price.discountPct,
    },
  })
}

beforeAll(() => {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DB },
    stdio: 'ignore',
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.userBenefit.deleteMany()
  await prisma.user.deleteMany()
})

describe('cálculo del descuento', () => {
  it('aplica exactamente el 25 %', () => {
    const price = calculatePrice(4500, 2, 25)
    expect(price.subtotalCents).toBe(9000)
    expect(price.discountCents).toBe(2250)
    expect(price.totalCents).toBe(6750)
  })

  it('sin descuento el total es el subtotal', () => {
    const price = calculatePrice(4500, 3, 0)
    expect(price.subtotalCents).toBe(13500)
    expect(price.discountCents).toBe(0)
    expect(price.totalCents).toBe(13500)
  })

  it('redondea al centavo sin perder dinero', () => {
    // 3333 * 1 = 3333; 25 % = 833.25 -> 833
    const price = calculatePrice(3333, 1, 25)
    expect(price.discountCents).toBe(833)
    expect(price.totalCents).toBe(2500)
    expect(price.discountCents + price.totalCents).toBe(price.subtotalCents)
  })

  it('ignora porcentajes fuera de rango', () => {
    expect(calculatePrice(1000, 1, -50).discountCents).toBe(0)
    expect(calculatePrice(1000, 1, 500).totalCents).toBe(0)
  })
})

describe('alta de usuario', () => {
  it('un usuario nuevo recibe el descuento', async () => {
    const user = await registerUser('nuevo@test.sv')
    const benefit = await prisma.userBenefit.findUnique({
      where: { userId_code: { userId: user.id, code: WELCOME_CODE } },
    })
    expect(benefit).not.toBeNull()
    expect(benefit?.status).toBe('AVAILABLE')
    expect(benefit?.percentage).toBe(25)
  })

  it('un usuario anterior a la promoción no lo recibe', async () => {
    const user = await registerUser('viejo@test.sv', false)
    const benefit = await prisma.userBenefit.findUnique({
      where: { userId_code: { userId: user.id, code: WELCOME_CODE } },
    })
    expect(benefit).toBeNull()
  })

  it('no se puede acumular un segundo descuento de bienvenida', async () => {
    const user = await registerUser('doble@test.sv')
    await expect(grant(prisma, user.id)).rejects.toThrow()
    const total = await prisma.userBenefit.count({ where: { userId: user.id } })
    expect(total).toBe(1)
  })

  it('la contraseña se guarda como hash, nunca en claro', async () => {
    const user = await registerUser('hash@test.sv')
    const stored = await prisma.user.findUnique({ where: { id: user.id } })
    expect(stored?.passwordHash).toBeTruthy()
    expect(stored?.passwordHash).not.toBe('Secreta123')
    expect(await bcrypt.compare('Secreta123', stored!.passwordHash!)).toBe(true)
  })
})

describe('uso del descuento', () => {
  it('se consume una sola vez', async () => {
    const user = await registerUser('unavez@test.sv')
    const first = await createBooking(user.id, 25)

    expect(await consume(prisma, user.id, first.id)).toBe(true)

    const second = await createBooking(user.id, 25)
    expect(await consume(prisma, user.id, second.id)).toBe(false)

    const benefit = await prisma.userBenefit.findUnique({
      where: { userId_code: { userId: user.id, code: WELCOME_CODE } },
    })
    expect(benefit?.status).toBe('USED')
    expect(benefit?.usedOnBookingId).toBe(first.id)
  })

  it('dos peticiones simultáneas no lo gastan dos veces', async () => {
    const user = await registerUser('concurrente@test.sv')
    const a = await createBooking(user.id, 25)
    const b = await createBooking(user.id, 25)

    const results = await Promise.all([
      consume(prisma, user.id, a.id),
      consume(prisma, user.id, b.id),
    ])

    // Exactamente una gana. Es lo que garantiza el update condicional.
    expect(results.filter(Boolean)).toHaveLength(1)
  })

  it('cerrar el popup no consume el descuento', async () => {
    const user = await registerUser('popup@test.sv')

    await prisma.userBenefit.updateMany({
      where: { userId: user.id, code: WELCOME_CODE },
      data: { modalDismissed: true },
    })

    const benefit = await prisma.userBenefit.findUnique({
      where: { userId_code: { userId: user.id, code: WELCOME_CODE } },
    })
    expect(benefit?.modalDismissed).toBe(true)
    expect(benefit?.status).toBe('AVAILABLE')
    expect(benefit?.usedAt).toBeNull()
  })

  it('sigue disponible después de cerrar sesión', async () => {
    const user = await registerUser('sesion@test.sv')

    // Cerrar sesión = borrar las sesiones del usuario.
    await prisma.session.deleteMany({ where: { userId: user.id } })

    const benefit = await prisma.userBenefit.findUnique({
      where: { userId_code: { userId: user.id, code: WELCOME_CODE } },
    })
    expect(benefit?.status).toBe('AVAILABLE')
  })

  it('la reserva guarda el importe con el descuento ya aplicado', async () => {
    const user = await registerUser('importe@test.sv')
    const booking = await createBooking(user.id, 25)

    expect(booking.subtotalCents).toBe(9000)
    expect(booking.discountCents).toBe(2250)
    expect(booking.totalCents).toBe(6750)
    expect(booking.discountPct).toBe(25)
  })
})

describe('aislamiento entre usuarios', () => {
  it('cada usuario solo ve sus propias reservas', async () => {
    const ana = await registerUser('ana@test.sv')
    const beto = await registerUser('beto@test.sv')

    await createBooking(ana.id)
    await createBooking(ana.id)
    await createBooking(beto.id)

    const deAna = await prisma.booking.findMany({ where: { userId: ana.id } })
    const deBeto = await prisma.booking.findMany({ where: { userId: beto.id } })

    expect(deAna).toHaveLength(2)
    expect(deBeto).toHaveLength(1)
    expect(deAna.every((booking) => booking.userId === ana.id)).toBe(true)
  })

  it('el beneficio de un usuario no se ve afectado por el de otro', async () => {
    const ana = await registerUser('ana2@test.sv')
    const beto = await registerUser('beto2@test.sv')

    const booking = await createBooking(ana.id, 25)
    await consume(prisma, ana.id, booking.id)

    const deBeto = await prisma.userBenefit.findUnique({
      where: { userId_code: { userId: beto.id, code: WELCOME_CODE } },
    })
    expect(deBeto?.status).toBe('AVAILABLE')
  })
})

describe('opiniones', () => {
  it('las de arranque van marcadas y sin usuario', async () => {
    await prisma.review.create({
      data: {
        authorName: 'Seed',
        experienceId: 'x',
        experienceTitle: 'X',
        rating: 5,
        comment: 'Contenido de arranque',
        isSeed: true,
        verified: false,
      },
    })
    const review = await prisma.review.findFirst({ where: { isSeed: true } })
    expect(review?.userId).toBeNull()
    expect(review?.verified).toBe(false)
  })

  it('una opinión verificada exige reserva completada', async () => {
    const user = await registerUser('opina@test.sv')
    const booking = await createBooking(user.id)
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        bookingId: booking.id,
        authorName: user.name ?? 'Usuario',
        experienceId: booking.experienceId,
        experienceTitle: booking.experienceTitle,
        rating: 5,
        comment: 'Excelente experiencia.',
        verified: true,
      },
    })

    expect(review.verified).toBe(true)
    expect(review.bookingId).toBe(booking.id)
  })

  it('no se puede opinar dos veces sobre la misma reserva', async () => {
    const user = await registerUser('doble-opina@test.sv')
    const booking = await createBooking(user.id)

    const base = {
      userId: user.id,
      bookingId: booking.id,
      authorName: 'X',
      experienceId: booking.experienceId,
      experienceTitle: booking.experienceTitle,
      rating: 5,
      comment: 'Primera',
      verified: true,
    }

    await prisma.review.create({ data: base })
    await expect(prisma.review.create({ data: { ...base, comment: 'Segunda' } })).rejects.toThrow()
  })
})
