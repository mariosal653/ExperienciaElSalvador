'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, MapPin } from 'lucide-react'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { ExperienceCard } from '@/components/experience/experience-card'
import { useFavorites } from '@/components/favorites/use-favorites'
import { useReviewStats } from '@/components/reviews/use-review-stats'
import { destinationPages, getDestinationPage } from '@/lib/destination-details'

/**
 * Vista de un destino. Recibe solo el id: el contenido sale del catálogo
 * compartido (lib/destination-details.ts), que también usa el servidor.
 */
export function DestinationView({ destinationId }: { destinationId: string }) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const page = getDestinationPage(destinationId)
  const stats = useReviewStats()
  const { ids: favorites, toggle } = useFavorites()

  // Ver la nota sobre «hoy» en components/home/home-view.tsx.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  const { setLead } = useWhatsAppLead()
  useEffect(() => {
    setLead({ lang, destination: page?.destination.name ?? null, date: null, people: null })
  }, [lang, page?.destination.name, setLead])

  if (!page) return null

  const others = destinationPages().filter((item) => item.destination.id !== destinationId)
  const count = page.experiences.length

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <SiteHeader />

      <section className="relative flex min-h-[340px] items-end overflow-hidden bg-[#174b51] md:min-h-[420px]">
        <img
          src={page.image.src}
          alt={page.image.alt[lang]}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c373d]/90 via-[#0c373d]/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-10 pt-24 text-white lg:px-8">
          <nav aria-label={es ? 'Ruta de navegación' : 'Breadcrumb'} className="mb-4 flex flex-wrap items-center gap-1 text-xs text-white/80">
            <Link href="/" className="hover:underline">{es ? 'Inicio' : 'Home'}</Link>
            <ChevronRight size={12} />
            <Link href="/#destinos" className="hover:underline">{es ? 'Destinos' : 'Destinations'}</Link>
            <ChevronRight size={12} />
            <span aria-current="page" className="font-semibold text-white">{page.destination.name}</span>
          </nav>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[#f4d27c]">
            <MapPin size={15} /> {page.destination.region[lang]}, El Salvador
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">{page.destination.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{page.intro[lang]}</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {es
            ? `${count} ${count === 1 ? 'experiencia' : 'experiencias'} en ${page.destination.name}`
            : `${count} ${count === 1 ? 'experience' : 'experiences'} in ${page.destination.name}`}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {page.experiences.map((item) => (
            <ExperienceCard
              key={item.id}
              item={item}
              lang={lang}
              stats={stats}
              now={now}
              saved={favorites.includes(item.id)}
              onToggleSave={toggle}
            />
          ))}
        </div>

        <section className="mt-16" aria-labelledby="other-destinations">
          <div className="flex items-end justify-between gap-4">
            <h2 id="other-destinations" className="text-xl font-semibold">{es ? 'Otros destinos' : 'Other destinations'}</h2>
            <Link href="/#experiencias" className="flex items-center gap-1.5 text-sm font-bold text-[#b8481c]">
              {es ? 'Todas las experiencias' : 'All experiences'} <ArrowRight size={16} />
            </Link>
          </div>
          <ul className="mt-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
            {others.map((other) => (
              <li key={other.destination.id} className="shrink-0">
                <Link
                  href={`/destinos/${other.destination.id}`}
                  className="group relative block h-32 w-44 overflow-hidden rounded-2xl text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8481c]"
                >
                  <img src={other.image.src} alt={other.image.alt[lang]} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 text-sm font-semibold leading-tight">{other.destination.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
