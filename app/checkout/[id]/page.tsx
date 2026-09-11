import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { experiences } from '@/lib/data'
import { getUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { getUsableWelcomeBenefit, releaseStaleReservation } from '@/lib/benefits'
import { publicPaymentInfo } from '@/lib/payments/config'
import { bookableRange } from '@/lib/dates'
import { CheckoutView } from '@/components/checkout/checkout-view'

/**
 * Checkout SIN registro.
 *
 * La sesión es opcional: si existe, se rellenan nombre y correo, la
 * reserva queda en el perfil y se ofrece el descuento de bienvenida. Si
 * no existe, se compra igual.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string; people?: string }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { id } = await params
  const query = await searchParams

  const experience = experiences.find((item) => item.id === id)
  if (!experience) notFound()

  const user = await getUser()

  // El descuento se consulta en el SERVIDOR. El navegador solo recibe el
  // porcentaje para la vista previa; el importe real se recalcula al pagar.
  let discountPct = 0
  if (user?.id) {
    try {
      await releaseStaleReservation(prisma, user.id)
      discountPct = (await getUsableWelcomeBenefit(user.id))?.percentage ?? 0
    } catch (error) {
      // Sin base de datos el checkout se muestra igual; el envío fallará
      // con un mensaje claro.
      console.error('[checkout] no se pudo consultar el beneficio', error instanceof Error ? error.message : error)
    }
  }

  const initialPeople = Number.parseInt(query.people ?? '', 10)

  return (
    <CheckoutView
      experience={{
        id: experience.id,
        title: experience.title,
        destination: experience.destination,
        image: experience.image,
        imageAlt: experience.imageAlt,
        priceUsd: experience.priceUsd,
        durationHours: experience.durationHours,
        maxPeople: experience.maxPeople,
        weekdays: experience.weekdays,
      }}
      user={user ? { name: user.name ?? '', email: user.email ?? '' } : null}
      discountPct={discountPct}
      payment={publicPaymentInfo()}
      range={bookableRange()}
      initialDate={/^\d{4}-\d{2}-\d{2}$/.test(query.date ?? '') ? (query.date as string) : null}
      initialPeople={Number.isFinite(initialPeople) ? initialPeople : null}
    />
  )
}
