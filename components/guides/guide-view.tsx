'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, ChevronRight, Lightbulb, MessageCircle } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { QuoteActions } from '@/components/services/quote-actions'
import { catalog, experienceName, isBookableOnline } from '@/lib/data'
import { experienceQuoteWhatsApp } from '@/lib/experience-quote'
import { getService } from '@/lib/services'
import { getGuide, guides } from '@/lib/guides'

/**
 * Página de una guía de inspiración: el itinerario día por día y, en cada
 * parada, la experiencia o el servicio que la cubre con su acción
 * (reservar en línea o cotizar). Los precios salen del catálogo.
 */
export function GuideView({ slug }: { slug: string }) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const guide = getGuide(slug)

  const { setLead } = useWhatsAppLead()
  useEffect(() => {
    setLead({ lang, destination: null, date: null, people: null })
  }, [lang, setLead])

  if (!guide) return null
  const others = guides.filter((item) => item.slug !== guide.slug)

  return (
    <div className="min-h-screen bg-cream text-brand">
      <SiteHeader />

      <section className="on-dark relative flex min-h-[360px] items-end overflow-hidden bg-brand-hero md:min-h-[440px]">
        <Picture
          src={guide.image.src}
          alt={guide.image.alt[lang]}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c373d]/90 via-[#0c373d]/45 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-10 pt-24 text-white lg:px-8">
          <nav aria-label={es ? 'Ruta de navegación' : 'Breadcrumb'} className="mb-4 flex flex-wrap items-center gap-1 text-xs text-white/80">
            <Link href="/" className="hover:underline">{es ? 'Inicio' : 'Home'}</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href="/#ideas" className="hover:underline">{es ? 'Ideas de viaje' : 'Trip ideas'}</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span aria-current="page" className="font-semibold text-white">{guide.title[lang]}</span>
          </nav>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gold-soft">
            <CalendarDays size={15} aria-hidden="true" /> {guide.length[lang]}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">{guide.title[lang]}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{guide.intro[lang]}</p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
        <ol className="relative space-y-10 border-l-2 border-line pl-6 md:pl-10">
          {guide.stops.map((stop, index) => (
            <li key={index} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[33px] top-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-accent bg-cream md:-left-[49px]"
              />
              <p className="text-xs font-bold uppercase tracking-[.16em] text-accent-deep">{stop.label[lang]}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{stop.title[lang]}</h2>
              <p className="mt-3 leading-relaxed text-muted">{stop.text[lang]}</p>
              {stop.serviceId && <ServiceOffer serviceId={stop.serviceId} />}
              {stop.experienceIds?.map((id) => <ExperienceOffer key={id} experienceId={id} />)}
            </li>
          ))}
        </ol>

        <aside className="mt-14 rounded-2xl bg-white p-6 shadow-card md:p-8">
          <p className="flex items-center gap-2 font-semibold">
            <Lightbulb size={18} className="text-gold-ink" aria-hidden="true" />
            {es ? 'Consejo' : 'Tip'}
          </p>
          <p className="mt-2 leading-relaxed text-muted">{guide.tip[lang]}</p>
          <div className="mt-5">
            <QuoteActions
              service={guide.title[lang]}
              kind="experience"
              lang={lang}
              source="guia"
              details={guide.stops.map((stop) => `${stop.label[lang]}: ${stop.title[lang]}`).join(' · ')}
            />
          </div>
        </aside>

        <section className="mt-16" aria-labelledby="otras-ideas">
          <h2 id="otras-ideas" className="text-xl font-semibold">{es ? 'Otras ideas de viaje' : 'More trip ideas'}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={`/guias/${other.slug}`} className="group flex items-center gap-4 rounded-2xl bg-white p-3 shadow-card transition hover:shadow-card-hover">
                  <Picture src={other.image.src} sizes="96px" alt="" loading="lazy" decoding="async" width={96} height={72} className="h-18 w-24 shrink-0 rounded-xl object-cover" />
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{other.title[lang]}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs font-bold text-accent">
                      {other.length[lang]} <ArrowRight size={13} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
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

/** El servicio que cubre una parada, con enlace a su página. */
function ServiceOffer({ serviceId }: { serviceId: string }) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const service = getService(serviceId)
  if (!service) return null
  return (
    <Link
      href={`/servicios/${service.id}`}
      className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-card transition hover:shadow-card-hover"
    >
      <span>
        <span className="block font-semibold">{service.name}</span>
        <span className="text-xs text-muted">{es ? 'Conductor privado, por horas' : 'Private driver, by the hour'}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-accent">
        {es ? 'Ver servicio' : 'See service'} <ArrowRight size={15} aria-hidden="true" />
      </span>
    </Link>
  )
}

/** Una experiencia que cubre una parada, con su acción: reservar o cotizar. */
function ExperienceOffer({ experienceId }: { experienceId: string }) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const experience = catalog.find((item) => item.id === experienceId)
  if (!experience) return null
  const online = isBookableOnline(experience)
  const name = experienceName(experience, lang)

  return (
    <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-white p-3 shadow-card sm:flex-row sm:items-center">
      <Link href={`/experiences/${experience.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <Picture src={experience.image} sizes="112px" alt="" loading="lazy" decoding="async" width={112} height={84} className="h-20 w-28 shrink-0 rounded-xl object-cover" />
        <span className="min-w-0">
          <span className="block font-semibold leading-snug hover:text-accent">{name}</span>
          <span className="mt-1 block text-xs text-muted">
            {experience.durationHours} {es ? 'horas' : 'hours'}
            {experience.priceUsd !== null && (
              <>
                {' · '}
                {es ? 'Desde' : 'From'} <strong className="text-brand">${experience.priceUsd}</strong> {es ? '/ persona' : '/ person'}
              </>
            )}
          </span>
        </span>
      </Link>
      {online ? (
        <a
          href={`/checkout/${experience.id}`}
          className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-accent-dark"
        >
          {es ? 'Reservar' : 'Book now'}
        </a>
      ) : (
        <a
          href={experienceQuoteWhatsApp(experience, lang)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-accent px-5 py-2.5 text-sm font-bold text-accent transition hover:bg-accent hover:text-white"
        >
          <MessageCircle size={15} aria-hidden="true" />
          {es ? 'Cotizar' : 'Get a quote'}
        </a>
      )}
    </div>
  )
}
