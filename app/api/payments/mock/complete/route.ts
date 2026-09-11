import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payments/config'
import { approvePayment, declinePayment } from '@/lib/payments/process'
import { randomToken } from '@/lib/security'

/**
 * POST /api/payments/mock/complete — pasarela SIMULADA.
 *
 * Solo existe con WOMPI_ENVIRONMENT=mock (o sin configurar en desarrollo).
 * Con Wompi real configurado responde 404: no hay forma de aprobar un pago
 * desde el navegador.
 *
 * Solo acepta pagos creados como mock: un pago de Wompi no puede
 * «aprobarse» por aquí aunque se cambie la configuración después.
 */

export const dynamic = 'force-dynamic'

const schema = z.object({
  reference: z.string().min(10).max(80),
  outcome: z.enum(['approve', 'decline']),
})

export async function POST(request: Request) {
  const config = getPaymentConfig()
  if (config.status !== 'ready' || config.mode !== 'mock') {
    return NextResponse.json({ ok: false, code: 'notFound' }, { status: 404 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false, code: 'validation' }, { status: 422 })

  const payment = await prisma.payment.findUnique({
    where: { reference: parsed.data.reference },
    include: { booking: { select: { accessToken: true } } },
  })
  if (!payment || payment.provider !== 'mock') {
    return NextResponse.json({ ok: false, code: 'notFound' }, { status: 404 })
  }

  if (parsed.data.outcome === 'decline') {
    await declinePayment(payment.id, 'mockDeclined')
    return NextResponse.json({ ok: true, outcome: 'declined', accessToken: payment.booking.accessToken })
  }

  const result = await approvePayment({
    paymentId: payment.id,
    transactionId: payment.providerTransactionId ?? `mock_${randomToken(12)}`,
    amountCents: payment.amountCents,
    authorizationCode: 'MOCK00',
    isReal: false,
    source: 'mock',
  })

  if (result.outcome === 'rejected') {
    return NextResponse.json({ ok: false, code: result.reason }, { status: 409 })
  }
  return NextResponse.json({ ok: true, outcome: result.outcome, accessToken: payment.booking.accessToken })
}
