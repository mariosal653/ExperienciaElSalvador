'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, MapPin } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { SiteHeader } from '@/components/site/site-header'
import { DestinationName, DestinationPhoto } from '@/components/destination/destination-transition'
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

  /**
   * Arriba del todo ANTES de que el navegador capture la página nueva para
   * la transición desde la tarjeta (components/destination/destination-
   * transition.tsx). Next sube el scroll después, y para entonces la
   * captura ya está hecha con el héroe fuera de la pantalla: la foto no
   * tendría a dónde volar. useLayoutEffect corre dentro de ese mismo paso.
   * `instant` porque html lleva scroll-behavior: smooth (app/globals.css).
   */
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setLeavingTo(null)
  }, [destinationId])

  /**
   * Tarjeta de «Otros destinos» que se acaba de pulsar. Solo ella recibe
   * nombre de transición, y lo recibe en el clic, ANTES de que arranque la
   * navegación: si toda la tira lo llevara siempre, al llegar desde la
   * portada volarían todas sus tarjetas hacia aquí, no solo la elegida.
   */
  const [leavingTo, setLeavingTo] = useState<string | null>(null)

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
    <div className="min-h-screen bg-cream text-brand">
      <SiteHeader />

      <section className="relative flex min-h-[340px] items-end overflow-hidden bg-brand-hero md:min-h-[420px]">
        <DestinationPhoto id={page.destination.id} className="absolute inset-0">
          <Picture
            src={page.image.src}
            alt={page.image.alt[lang]}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dentro de la pieza que vuela: si no, la foto aterrizaría clara y se oscurecería de golpe. */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c373d]/90 via-[#0c373d]/40 to-transparent" />
        </DestinationPhoto>
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-10 pt-24 text-white lg:px-8">
          <nav aria-label={es ? 'Ruta de navegación' : 'Breadcrumb'} className="mb-4 flex flex-wrap items-center gap-1 text-xs text-white/80">
            <Link href="/" className="hover:underline">{es ? 'Inicio' : 'Home'}</Link>
            <ChevronRight size={12} />
            <Link href="/#destinos" className="hover:underline">{es ? 'Destinos' : 'Destinations'}</Link>
            <ChevronRight size={12} />
            <span aria-current="page" className="font-semibold text-white">{page.destination.name}</span>
          </nav>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gold-soft">
            <MapPin size={15} /> {page.destination.region[lang]}, El Salvador
          </p>
          <DestinationName id={page.destination.id}>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">{page.destination.name}</h1>
          </DestinationName>
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
            <Link href="/#experiencias" className="flex items-center gap-1.5 text-sm font-bold text-accent">
              {es ? 'Todas las experiencias' : 'All experiences'} <ArrowRight size={16} />
            </Link>
          </div>
          <ul className="mt-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
            {others.map((other) => (
              <li key={other.destination.id} className="shrink-0">
                <Link
                  href={`/destinos/${other.destination.id}`}
                  onClick={() => setLeavingTo(other.destination.id)}
                  className="group relative block h-32 w-44 overflow-hidden rounded-2xl text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <DestinationPhoto id={other.destination.id} enabled={leavingTo === other.destination.id} className="absolute inset-0 overflow-hidden rounded-2xl">
                    <Picture src={other.image.src} sizes="176px" alt={other.image.alt[lang]} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  </DestinationPhoto>
                  <span className="absolute inset-x-3 bottom-3">
                    <DestinationName id={other.destination.id} enabled={leavingTo === other.destination.id}>
                      <span className="block text-sm font-semibold leading-tight">{other.destination.name}</span>
                    </DestinationName>
                  </span>
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
