import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payments/config'
import { verifyRedirectSignature } from '@/lib/payments/wompi'
import { reconcileWompiTransaction } from '@/lib/payments/process'

/**
 * Retorno desde el enlace de pago de Wompi.
 *
 * Wompi redirige aquí con: identificadorEnlaceComercio, idTransaccion,
 * idEnlace, monto y hash. NADA de eso se da por bueno: con el
 * idTransaccion se pregunta a la API de Wompi y se actúa según su
 * respuesta. El hash solo sirve para detectar enlaces manipulados.
 *
 * Si el cliente cierra la pestaña antes de llegar aquí no pasa nada: el
 * webhook confirma el pago igualmente.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payment',
  robots: { index: false, follow: false },
}

type Search = Record<string, string | string[] | undefined>

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams
  const reference = one(query.ref) || one(query.identificadorEnlaceComercio)
  const transactionId = one(query.idTransaccion)

  const payment = reference
    ? await prisma.payment.findUnique({
        where: { reference },
        select: { id: true, reference: true, booking: { select: { accessToken: true } } },
      })
    : null

  if (!payment) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf7] px-5 text-center text-[#173f45]">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold">We could not find this payment</h1>
          <p className="mt-2 text-sm text-[#6a8588]">
            If you completed a payment, you will receive the confirmation by email. No encontramos este pago: si
            pagaste, recibirás la confirmación por correo.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white">
            Back to Experiences
          </Link>
        </div>
      </main>
    )
  }

  const config = getPaymentConfig()
  if (transactionId && config.status === 'ready' && config.mode !== 'mock') {
    const signed = verifyRedirectSignature(
      {
        reference: one(query.identificadorEnlaceComercio),
        transactionId,
        linkId: one(query.idEnlace),
        amount: one(query.monto),
        hash: one(query.hash),
      },
      config.clientSecret,
    )
    if (!signed) {
      // No bloquea: la decisión la toma la consulta a la API, no la URL.
      console.warn('[return] hash de retorno inválido o ausente', { reference: payment.reference })
    }
    await reconcileWompiTransaction(payment.id, transactionId)
  }

  // La página de la reserva muestra el estado real y, si el pago aún se
  // está procesando, se actualiza sola.
  redirect(`/booking/${payment.booking.accessToken}`)
}
