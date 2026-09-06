import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { formatCents } from '@/lib/pricing'
import { AccountShell } from '@/components/account/account-shell'
import { BookingCard } from '@/components/account/booking-card'

export const metadata = { title: 'My experiences' }
export const dynamic = 'force-dynamic'

export default async function MyExperiencesPage() {
  const user = await requireUser('/cuenta/experiencias')

  // Filtrado por el userId de la SESION. Un usuario no puede pedir las de otro.
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { review: { select: { id: true } } },
  })

  return (
    <AccountShell user={user} active="experiencias">
      <h1 className="text-2xl font-semibold tracking-tight text-[#173f45] md:text-3xl">Mis experiencias</h1>
      <p className="mt-1.5 text-sm text-[#6a8588]">
        {bookings.length > 0
          ? `${bookings.length} ${bookings.length === 1 ? 'reserva' : 'reservas'} en total.`
          : 'Aquí aparecerán tus reservas.'}
      </p>

      {bookings.length > 0 ? (
        <div className="mt-8 grid gap-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={{
                id: booking.id,
                code: booking.code,
                title: booking.experienceTitle,
                image: booking.experienceImage,
                destination: booking.destination,
                date: booking.date,
                people: booking.people,
                status: booking.status,
                total: formatCents(booking.totalCents),
                discountCents: booking.discountCents,
                hasReview: booking.review !== null,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[#b7c5c1] bg-white p-8 text-center md:p-12">
          <p className="text-lg font-semibold text-[#173f45]">Aún no tienes experiencias</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#6a8588]">
            Explora todo lo que puedes descubrir en El Salvador.
          </p>
          <Link
            href="/#experiencias"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#963b18]"
          >
            Explorar experiencias <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </AccountShell>
  )
}
