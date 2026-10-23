import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { experiences } from '@/lib/data'
import { AccountShell } from '@/components/account/account-shell'
import { RemoveFavoriteButton } from '@/components/favorites/remove-favorite-button'

export const metadata = { title: 'Saved experiences' }
export const dynamic = 'force-dynamic'

export default async function SavedPage() {
  const user = await requireUser('/cuenta/guardadas')

  // Filtrado por el userId de la SESIÓN.
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { experienceId: true },
  })
  const saved = favorites
    .map((favorite) => experiences.find((item) => item.id === favorite.experienceId))
    .filter((item): item is (typeof experiences)[number] => item !== undefined)

  return (
    <AccountShell user={user} active="guardadas">
      <h1 className="text-2xl font-semibold tracking-tight text-brand md:text-3xl">Guardadas</h1>
      <p className="mt-1.5 text-sm text-muted">
        {saved.length > 0
          ? `${saved.length} ${saved.length === 1 ? 'experiencia guardada' : 'experiencias guardadas'}. Las ves igual en cualquier dispositivo.`
          : 'Toca el ♥ de una experiencia para guardarla aquí.'}
      </p>

      {saved.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((item) => (
            <article key={item.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-card">
              <Link href={`/experiences/${item.id}`} className="block">
                <div className="h-40 overflow-hidden">
                  <img src={item.image} alt={item.imageAlt.ES} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <p className="flex items-center gap-1 text-xs text-muted"><MapPin size={13} />{item.destination}</p>
                  <p className="mt-1 font-semibold text-brand">{item.name.ES}</p>
                  <p className="mt-2 text-sm text-brand">
                    <strong>${item.priceUsd}</strong> <span className="text-xs text-muted">/ persona · {item.durationHours} h</span>
                  </p>
                </div>
              </Link>
              <RemoveFavoriteButton experienceId={item.id} name={item.name.ES} />
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center md:p-12">
          <p className="text-lg font-semibold text-brand">Aún no guardas experiencias</p>
          <Link
            href="/#experiencias"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-dark"
          >
            Explorar experiencias <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </AccountShell>
  )
}
