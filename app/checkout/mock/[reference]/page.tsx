import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payments/config'
import { MockPayment } from '@/components/checkout/mock-payment'

/**
 * Pasarela SIMULADA (WOMPI_ENVIRONMENT=mock).
 *
 * Sustituye a la página de Wompi mientras no hay credenciales. No pide
 * datos de tarjeta —ni falsos—: solo deja aprobar o rechazar, para probar
 * el flujo completo de principio a fin. Con Wompi configurado, 404.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Test payment',
  robots: { index: false, follow: false },
}

export default async function MockPaymentPage({ params }: { params: Promise<{ reference: string }> }) {
  const config = getPaymentConfig()
  if (config.status !== 'ready' || config.mode !== 'mock') notFound()

  const { reference } = await params
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { booking: { select: { code: true, experienceTitle: true, date: true, people: true, accessToken: true, status: true } } },
  })
  if (!payment || payment.provider !== 'mock') notFound()

  return (
    <MockPayment
      reference={payment.reference}
      amountCents={payment.amountCents}
      status={payment.status}
      booking={{
        code: payment.booking.code,
        title: payment.booking.experienceTitle,
        date: payment.booking.date,
        people: payment.booking.people,
        accessToken: payment.booking.accessToken,
      }}
    />
  )
}
