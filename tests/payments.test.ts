import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { createHmac } from 'node:crypto'

/**
 * Pruebas del flujo de pago: firmas de Wompi, configuración, validación y,
 * contra una base SQLite real, idempotencia de la aprobación y emisión de
 * entradas.
 */

const TEST_DB = 'file:./test.db'
process.env.DATABASE_URL = TEST_DB

// Se importan DESPUÉS de fijar DATABASE_URL: el cliente Prisma la lee al crearse.
type Modules = {
  prisma: typeof import('../lib/db').prisma
  checkout: typeof import('../lib/checkout')
  process: typeof import('../lib/payments/process')
  wompi: typeof import('../lib/payments/wompi')
  config: typeof import('../lib/payments/config')
  validation: typeof import('../lib/checkout-validation')
  security: typeof import('../lib/security')
  availability: typeof import('../lib/availability')
  dates: typeof import('../lib/dates')
}
let m: Modules

beforeAll(async () => {
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: TEST_DB }, stdio: 'ignore' })
  m = {
    prisma: (await import('../lib/db')).prisma,
    checkout: await import('../lib/checkout'),
    process: await import('../lib/payments/process'),
    wompi: await import('../lib/payments/wompi'),
    config: await import('../lib/payments/config'),
    validation: await import('../lib/checkout-validation'),
    security: await import('../lib/security'),
    availability: await import('../lib/availability'),
    dates: await import('../lib/dates'),
  }
})

afterAll(async () => {
  await m?.prisma.$disconnect()
})

beforeEach(async () => {
  await m.prisma.ticket.deleteMany()
  await m.prisma.payment.deleteMany()
  await m.prisma.review.deleteMany()
  await m.prisma.booking.deleteMany()
  await m.prisma.userBenefit.deleteMany()
  await m.prisma.user.deleteMany()
  await m.prisma.availability.deleteMany()
})

/* ------------------------------------------------------------------ */

describe('firma del webhook de Wompi', () => {
  const secret = 'api-secret-de-prueba'
  const body = '{"IdTransaccion":"abc-123","ResultadoTransaccion":"ExitosaAprobada","Monto":90}'
  const sign = (payload: string) => createHmac('sha256', secret).update(payload).digest('hex')

  it('acepta una firma correcta', () => {
    expect(m.wompi.verifyWebhookSignature(body, sign(body), secret)).toBe(true)
  })
  it('acepta la firma en mayúsculas', () => {
    expect(m.wompi.verifyWebhookSignature(body, sign(body).toUpperCase(), secret)).toBe(true)
  })
  it('rechaza un cuerpo modificado', () => {
    expect(m.wompi.verifyWebhookSignature(body.replace('90', '1'), sign(body), secret)).toBe(false)
  })
  it('rechaza sin firma o con otra clave', () => {
    expect(m.wompi.verifyWebhookSignature(body, null, secret)).toBe(false)
    expect(m.wompi.verifyWebhookSignature(body, sign(body), 'otra-clave')).toBe(false)
  })
})

describe('hash de la URL de retorno', () => {
  it('verifica identificador + transacción + enlace + monto', () => {
    const secret = 's3cr3t'
    const params = { reference: 'EES-ABC-XYZ', transactionId: 'tx-1', linkId: '99', amount: '90.00' }
    const hash = createHmac('sha256', secret).update('EES-ABC-XYZtx-19990.00').digest('hex')
    expect(m.wompi.verifyRedirectSignature({ ...params, hash }, secret)).toBe(true)
    expect(m.wompi.verifyRedirectSignature({ ...params, amount: '1.00', hash }, secret)).toBe(false)
  })
})

describe('configuración de pagos', () => {
  const saved = { ...process.env }
  const env = process.env as Record<string, string | undefined>
  afterAll(() => {
    process.env = saved
  })

  it('sin configurar en desarrollo → mock', () => {
    delete env.WOMPI_ENVIRONMENT
    env.NODE_ENV = 'development'
    expect(m.config.getPaymentConfig()).toEqual({ status: 'ready', mode: 'mock' })
  })
  it('sin configurar en producción → desactivado, nunca mock', () => {
    delete env.WOMPI_ENVIRONMENT
    env.NODE_ENV = 'production'
    expect(m.config.getPaymentConfig()).toMatchObject({ status: 'disabled', reason: 'notConfigured' })
  })
  it('sandbox sin claves → desactivado', () => {
    env.WOMPI_ENVIRONMENT = 'sandbox'
    delete env.WOMPI_PUBLIC_KEY
    delete env.WOMPI_PRIVATE_KEY
    expect(m.config.getPaymentConfig()).toMatchObject({ status: 'disabled', reason: 'missingKeys' })
  })
  it('el secreto del webhook cae al API Secret', () => {
    env.WOMPI_ENVIRONMENT = 'sandbox'
    env.WOMPI_PUBLIC_KEY = 'app-id'
    env.WOMPI_PRIVATE_KEY = 'api-secret'
    delete env.WOMPI_WEBHOOK_SECRET
    expect(m.config.getPaymentConfig()).toMatchObject({ mode: 'sandbox', webhookSecret: 'api-secret' })
    env.NODE_ENV = 'test'
    delete env.WOMPI_ENVIRONMENT
  })
})

describe('validación y saneado', () => {
  it('valida los datos del comprador', () => {
    expect(m.validation.validateCustomer({ name: 'Ana López', email: 'ana@correo.sv', phone: '+503 7000 0000' })).toEqual({})
    const errors = m.validation.validateCustomer({ name: 'A', email: 'ana@', phone: '12' })
    expect(errors).toEqual({ name: 'nameTooShort', email: 'emailInvalid', phone: 'phoneInvalid' })
  })
  it('quita etiquetas y caracteres de control', () => {
    const dirty = 'Ana' + String.fromCharCode(0) + ' <script>x</script>  López'
    expect(m.security.sanitizeText(dirty)).toBe('Ana scriptx/script López')
  })
  it('los tokens son largos y distintos', () => {
    const a = m.security.randomToken(24)
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(a).not.toBe(m.security.randomToken(24))
  })
})

describe('fechas en hora de El Salvador', () => {
  it('a las 8 p. m. en El Salvador sigue siendo el mismo día aunque en UTC ya sea mañana', () => {
    const now = new Date('2026-09-11T02:00:00Z') // 10 sep, 20:00 en El Salvador
    expect(m.dates.todayInElSalvador(now)).toBe('2026-09-10')
  })
  it('no se puede reservar para hoy; sí para mañana', () => {
    const now = new Date('2026-09-11T02:00:00Z')
    const experience = m.availability.findExperience('atardecer-el-tunco')! // sale todos los días
    expect(m.availability.checkBookableDate(experience, '2026-09-10', now)).toEqual({ ok: false, reason: 'dateTooSoon' })
    expect(m.availability.checkBookableDate(experience, '2026-09-11', now)).toEqual({ ok: true })
  })
})

/* ------------------------------------------------------------------ */
/* Contra la base de datos                                             */
/* ------------------------------------------------------------------ */

let keyCounter = 0
function input(overrides: Partial<import('../lib/checkout').CheckoutInput> = {}) {
  keyCounter += 1
  return {
    experienceId: 'atardecer-el-tunco',
    date: m.dates.bookableRange().first,
    people: 3,
    customer: { name: 'Ana López', email: `ana${keyCounter}@correo.sv`, phone: '+503 7000 0000', country: 'El Salvador' },
    acceptTerms: true as const,
    applyWelcomeDiscount: false,
    idempotencyKey: `test-key-${keyCounter}-${Date.now()}`,
    locale: 'EN' as const,
    ...overrides,
  }
}

async function createBookingWithPayment(overrides = {}) {
  const result = await m.checkout.createPendingBooking(input(overrides), { userId: null, isTest: true })
  if (!result.ok) throw new Error(result.failure.code)
  const payment = await m.prisma.payment.create({
    data: {
      bookingId: result.booking.id,
      provider: 'mock',
      environment: 'mock',
      amountCents: result.booking.totalCents,
      reference: `${result.booking.code}-${m.security.randomCode(16)}`,
    },
  })
  return { booking: result.booking, payment }
}

describe('checkout sin cuenta', () => {
  it('crea la reserva pendiente con el precio del catálogo', async () => {
    const result = await m.checkout.createPendingBooking(input(), { userId: null, isTest: true })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const booking = await m.prisma.booking.findUniqueOrThrow({ where: { id: result.booking.id } })
    expect(booking.status).toBe('PENDING_PAYMENT')
    expect(booking.userId).toBeNull()
    expect(booking.totalCents).toBe(3800 * 3) // $38 × 3 desde lib/data.ts
    expect(booking.accessToken.length).toBeGreaterThanOrEqual(43)
    expect(await m.prisma.ticket.count()).toBe(0) // sin pago, sin entradas
  })

  it('el mismo envío dos veces no crea dos reservas', async () => {
    const data = input()
    const first = await m.checkout.createPendingBooking(data, { userId: null, isTest: true })
    const second = await m.checkout.createPendingBooking(data, { userId: null, isTest: true })
    expect(first.ok && second.ok && first.booking.id === second.booking.id).toBe(true)
    expect(await m.prisma.booking.count()).toBe(1)
  })

  it('respeta el cupo por fecha', async () => {
    const date = m.dates.bookableRange().first
    await m.prisma.availability.create({ data: { experienceId: 'atardecer-el-tunco', date, capacity: 4 } })
    const first = await m.checkout.createPendingBooking(input({ people: 3 }), { userId: null, isTest: true })
    expect(first.ok).toBe(true)
    const second = await m.checkout.createPendingBooking(input({ people: 2 }), { userId: null, isTest: true })
    expect(second.ok).toBe(false)
    if (!second.ok) expect(second.failure).toMatchObject({ code: 'soldOut', remaining: 1 })
  })

  it('rechaza una fecha en que la experiencia no sale', async () => {
    // Ruta de las Flores: solo sábados y domingos.
    let date = m.dates.bookableRange().first
    while ([0, 6].includes(new Date(`${date}T12:00:00`).getDay())) date = m.dates.addDaysIso(date, 1)
    const result = await m.checkout.createPendingBooking(input({ experienceId: 'ruta-de-las-flores', date }), { userId: null, isTest: true })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.failure.code).toBe('notOperating')
  })
})

describe('aprobación del pago', () => {
  it('aprueba, emite una entrada por viajero y confirma', async () => {
    const { booking, payment } = await createBookingWithPayment()
    const result = await m.process.approvePayment({
      paymentId: payment.id,
      transactionId: 'tx-ok-1',
      amountCents: payment.amountCents,
      authorizationCode: 'A1',
      isReal: false,
      source: 'webhook',
    })
    expect(result.outcome).toBe('approved')
    const saved = await m.prisma.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { tickets: true } })
    expect(saved.status).toBe('CONFIRMED')
    expect(saved.tickets).toHaveLength(3)
    expect(new Set(saved.tickets.map((ticket) => ticket.token)).size).toBe(3)
  })

  it('es idempotente: el mismo aviso dos veces no duplica nada', async () => {
    const { booking, payment } = await createBookingWithPayment()
    const approval = { paymentId: payment.id, transactionId: 'tx-dup', amountCents: payment.amountCents, authorizationCode: null, isReal: false, source: 'webhook' as const }
    const [a, b] = await Promise.all([m.process.approvePayment(approval), m.process.approvePayment(approval)])
    expect([a.outcome, b.outcome].sort()).toEqual(['alreadyProcessed', 'approved'])
    const third = await m.process.approvePayment(approval)
    expect(third.outcome).toBe('alreadyProcessed')
    expect(await m.prisma.ticket.count({ where: { bookingId: booking.id } })).toBe(3)
  })

  it('rechaza un importe distinto al calculado', async () => {
    const { booking, payment } = await createBookingWithPayment()
    const result = await m.process.approvePayment({ paymentId: payment.id, transactionId: 'tx-bad', amountCents: 100, authorizationCode: null, isReal: false, source: 'webhook' })
    expect(result).toEqual({ outcome: 'rejected', reason: 'amountMismatch' })
    const saved = await m.prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
    expect(saved.status).toBe('PENDING_PAYMENT')
    expect(await m.prisma.ticket.count()).toBe(0)
  })

  it('en producción rechaza transacciones de prueba', async () => {
    const { payment } = await createBookingWithPayment()
    await m.prisma.payment.update({ where: { id: payment.id }, data: { environment: 'production', provider: 'wompi' } })
    const result = await m.process.approvePayment({ paymentId: payment.id, transactionId: 'tx-test', amountCents: payment.amountCents, authorizationCode: null, isReal: false, source: 'webhook' })
    expect(result).toEqual({ outcome: 'rejected', reason: 'testTransactionInProduction' })
  })

  it('una transacción no puede aprobar dos pagos distintos', async () => {
    const first = await createBookingWithPayment()
    const second = await createBookingWithPayment()
    await m.process.approvePayment({ paymentId: first.payment.id, transactionId: 'tx-shared', amountCents: first.payment.amountCents, authorizationCode: null, isReal: false, source: 'webhook' })
    const result = await m.process.approvePayment({ paymentId: second.payment.id, transactionId: 'tx-shared', amountCents: second.payment.amountCents, authorizationCode: null, isReal: false, source: 'webhook' })
    expect(result).toEqual({ outcome: 'rejected', reason: 'transactionAlreadyUsed' })
  })

  it('el descuento de bienvenida se aparta al reservar y se usa al pagar', async () => {
    const user = await m.prisma.user.create({ data: { email: `u${Date.now()}@correo.sv`, name: 'Luis' } })
    await m.prisma.userBenefit.create({ data: { userId: user.id, code: 'WELCOME25', percentage: 25, status: 'AVAILABLE' } })

    const result = await m.checkout.createPendingBooking(input({ applyWelcomeDiscount: true, people: 2 }), { userId: user.id, isTest: true })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.booking.totalCents).toBe(Math.round(3800 * 2 * 0.75))
    expect((await m.prisma.userBenefit.findFirstOrThrow({ where: { userId: user.id } })).status).toBe('RESERVED')

    // Un segundo intento con el descuento ya apartado se rechaza.
    const again = await m.checkout.createPendingBooking(input({ applyWelcomeDiscount: true, date: m.dates.addDaysIso(m.dates.bookableRange().first, 1) }), { userId: user.id, isTest: true })
    expect(again.ok).toBe(false)

    const payment = await m.prisma.payment.create({
      data: { bookingId: result.booking.id, provider: 'mock', environment: 'mock', amountCents: result.booking.totalCents, reference: `R-${m.security.randomCode(16)}` },
    })
    await m.process.approvePayment({ paymentId: payment.id, transactionId: 'tx-benefit', amountCents: payment.amountCents, authorizationCode: null, isReal: false, source: 'mock' })
    expect((await m.prisma.userBenefit.findFirstOrThrow({ where: { userId: user.id } })).status).toBe('USED')
  })
})
