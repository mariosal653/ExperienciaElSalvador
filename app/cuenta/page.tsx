import Link from 'next/link'
import { ArrowRight, Ticket, CalendarCheck, CheckCircle2 } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { getWelcomeBenefit } from '@/lib/benefits'
import { formatCents } from '@/lib/pricing'
import { AccountShell } from '@/components/account/account-shell'
import { BookingCard } from '@/components/account/booking-card'

export const metadata = { title: 'My account' }
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  // Autorizacion real: valida la sesion contra la base de datos.
  const user = await requireUser('/cuenta')

  const [benefit, bookings, completedCount] = await Promise.all([
    getWelcomeBenefit(user.id),
    prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { review: { select: { id: true } } },
    }),
    prisma.booking.count({ where: { userId: user.id, status: 'COMPLETED' } }),
  ])

  const totalBookings = await prisma.booking.count({ where: { userId: user.id } })

  return (
    <AccountShell user={user} active="perfil">
      <h1 className="text-2xl font-semibold tracking-tight text-[#173f45] md:text-3xl">
        {user.name ? `Hola, ${user.name.split(' ')[0]}` : 'Hola'}
      </h1>
      <p className="mt-1.5 text-sm text-[#6a8588]">{user.email}</p>

      {/* Beneficios — el descuento sigue visible aunque se cierre el popup */}
      <section className="mt-8" aria-labelledby="beneficios">
        <h2 id="beneficios" className="mb-3 text-sm font-bold uppercase tracking-[.14em] text-[#759096]">
          Beneficios
        </h2>

        {benefit ? (
          <div
            className={`flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between ${
              benefit.status === 'AVAILABLE'
                ? 'bg-[#173f45] text-white'
                : 'border border-[#dce7e1] bg-white text-[#173f45]'
            }`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${
                  benefit.status === 'AVAILABLE' ? 'bg-[#f4b942] text-[#173f45]' : 'bg-[#eaf1ed] text-[#6a8588]'
                }`}
              >
                <Ticket size={24} />
              </span>
              <div>
                <p className="text-lg font-semibold">
                  {benefit.percentage}% de descuento
                  {benefit.status === 'AVAILABLE' ? ' disponible' : ''}
                </p>
                <p className={`mt-0.5 text-sm ${benefit.status === 'AVAILABLE' ? 'text-white/75' : 'text-[#6a8588]'}`}>
                  {benefit.status === 'AVAILABLE' && 'En tu primera experiencia. Se aplica al reservar.'}
                  {benefit.status === 'USED' &&
                    `Utilizado el ${benefit.usedAt?.toLocaleDateString('es-SV') ?? ''}.`}
                  {benefit.status === 'EXPIRED' && 'Este beneficio ya venció.'}
                  {benefit.status === 'RESERVED' && 'Apartado para un pago en curso. Si no se completa, vuelve a estar disponible.'}
                </p>
              </div>
            </div>

            {benefit.status === 'AVAILABLE' && (
              <Link
                href="/#experiencias"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#963b18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4b942]"
              >
                Usarlo ahora <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#b7c5c1] bg-white p-6 text-sm text-[#6a8588]">
            No tienes beneficios activos en este momento.
          </p>
        )}
      </section>

      {/* Resumen */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Stat icon={<CalendarCheck size={18} />} label="Reservas" value={String(totalBookings)} />
        <Stat icon={<CheckCircle2 size={18} />} label="Completadas" value={String(completedCount)} />
      </section>

      {/* Ultimas experiencias */}
      <section className="mt-10" aria-labelledby="recientes">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="recientes" className="text-sm font-bold uppercase tracking-[.14em] text-[#759096]">
            Tus experiencias recientes
          </h2>
          {totalBookings > 0 && (
            <Link href="/cuenta/experiencias" className="text-sm font-bold text-[#b8481c] hover:underline">
              Ver todas
            </Link>
          )}
        </div>

        {bookings.length > 0 ? (
          <div className="grid gap-4">
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
                  href: `/booking/${booking.accessToken}`,
                  isTest: booking.isTest,
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </AccountShell>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#dce7e1] bg-white p-5">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eaf1ed] text-[#173f45]">{icon}</span>
      <div>
        <p className="text-2xl font-semibold leading-none text-[#173f45]">{value}</p>
        <p className="mt-1 text-xs text-[#6a8588]">{label}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[#b7c5c1] bg-white p-8 text-center md:p-12">
      <p className="text-lg font-semibold text-[#173f45]">Aún no tienes experiencias</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#6a8588]">
        Explora todo lo que puedes descubrir en El Salvador: volcanes, playas, pueblos y rutas de café.
      </p>
      <Link
        href="/#experiencias"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#963b18]"
      >
        Explorar experiencias <ArrowRight size={16} />
      </Link>
    </div>
  )
}
