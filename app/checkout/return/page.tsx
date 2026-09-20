import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payments/config'
import { verifyRedirectSignature } from '@/lib/payments/wompi'
import { capturePayPalPayment, declinePayment, reconcileWompiTransaction } from '@/lib/payments/process'

/**
 * Retorno desde la pasarela. Sirve a las dos.
 *
 * WOMPI redirige aquí con: identificadorEnlaceComercio, idTransaccion,
 * idEnlace, monto y hash. NADA de eso se da por bueno: con el
 * idTransaccion se pregunta a la API de Wompi y se actúa según su
 * respuesta. El hash solo sirve para detectar enlaces manipulados.
 *
 * PAYPAL redirige aquí con ?provider=paypal. Es EL punto donde se cobra:
 * la aprobación del comprador no mueve dinero, lo mueve la captura, que
 * se hace desde el servidor contra la API de PayPal. Igual que con
 * Wompi, no se cree nada de lo que traiga la URL: la reserva se marca
 * pagada con lo que responda PayPal, y solo si el importe coincide.
 *
 * Si el cliente cierra la pestaña antes de llegar aquí: con Wompi el
 * webhook confirma igualmente; con PayPal la orden queda aprobada pero
 * sin capturar, o sea sin cobro, y la reserva caduca sola.
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
        select: { id: true, reference: true, provider: true, booking: { select: { accessToken: true } } },
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

  /* ----------------------------- PayPal ----------------------------- */
  if (payment.provider === 'paypal') {
    if (one(query.cancelado) === '1') {
      // El comprador pulsó «Cancelar» en PayPal. No hay cobro. La reserva
      // sigue apartada hasta que venza, así que puede reintentar.
      await declinePayment(payment.id, 'paypal:cancelledByPayer')
    } else {
      // Captura en servidor: aquí es donde se cobra de verdad.
      await capturePayPalPayment(payment.id)
    }

    redirect(`/booking/${payment.booking.accessToken}`)
  }

  /* ------------------------------ Wompi ----------------------------- */
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
