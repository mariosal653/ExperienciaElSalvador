import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getUsableWelcomeBenefit } from '@/lib/benefits'
import { experiences } from '@/lib/data'
import { BookingForm } from '@/components/booking/booking-form'
import { AccountShell } from '@/components/account/account-shell'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const experience = experiences.find((item) => item.id === id)
  if (!experience) notFound()

  const user = await requireUser(`/reservar/${id}`)

  // El beneficio se consulta en el SERVIDOR. El navegador solo recibe si
  // hay descuento disponible y de cuánto; el cálculo real vuelve a hacerse
  // en el endpoint al confirmar.
  const benefit = await getUsableWelcomeBenefit(user.id)

  return (
    <AccountShell user={user} active="experiencias">
      <BookingForm
        experience={{
          id: experience.id,
          title: experience.title,
          destination: experience.destination,
          image: experience.image,
          priceUsd: experience.priceUsd,
          durationHours: experience.durationHours,
          maxPeople: experience.maxPeople,
          weekdays: experience.weekdays,
        }}
        discountPct={benefit?.percentage ?? 0}
      />
    </AccountShell>
  )
}
