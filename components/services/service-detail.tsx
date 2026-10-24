'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Car,
  Check,
  ChevronLeft,
  Clock,
  Languages,
  Route,
  Snowflake,
  Users,
  X,
} from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { QuoteActions } from '@/components/services/quote-actions'
import { QuoteCalculator } from '@/components/services/quote-calculator'
import { useLanguage } from '@/components/i18n/language-provider'
import { useWhatsAppLead } from '@/components/whatsapp/whatsapp-provider'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { guideAddOn, vehicle, type Service } from '@/lib/services'

const ICONS = { route: Route, car: Car } as const

/**
 * Página de un servicio de conductor.
 *
 * Responde a lo que pregunta quien está a punto de escribir: qué incluye,
 * qué no, en qué vehículo viaja y cuánto cuesta. Los botones de cotización
 * son los mismos de la portada (QuoteActions), con `source` distinto para
 * poder comparar desde dónde cotiza la gente.
 *
 * No hay reserva ni pago: un traslado se cierra hablando. Cuando exista el
 * cotizador automático, entra en esta página como un bloque más.
 */
export function ServiceDetail({ service, other }: { service: Service; other: Service }) {
  const { lang } = useLanguage()
  const es = lang === 'ES'
  const Icon = ICONS[service.icon]

  // El widget flotante de WhatsApp habla del servicio que se está viendo.
  const { setLead } = useWhatsAppLead()
  useEffect(() => {
    setLead({ lang, service: service.name })
  }, [lang, service.name, setLead])

  return (
    <main className="min-h-screen bg-cream text-brand">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 lg:px-8">
        <Link
          href="/#servicios"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-brand"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {es ? 'Servicios' : 'Services'}
        </Link>

        <header className="mt-5 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-brand">
            <Icon size={14} aria-hidden="true" />
            {es ? 'Transporte con conductor' : 'Transport with a driver'}
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{service.name}</h1>
          <p className="mt-2 text-lg font-semibold text-accent-deep">{service.tagline[lang]}</p>
          <p className="mt-5 leading-relaxed text-muted">{service.description[lang]}</p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:gap-8">
          <div className="space-y-6">
            {/* Lo que el viajero compara antes de escribir. */}
            <section className="rounded-3xl border border-line bg-surface p-6 lg:p-7">
              <h2 className="text-xl font-semibold">{es ? 'Qué incluye' : 'What is included'}</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <ul className="space-y-2.5">
                  {service.includes[lang].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                      <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2.5">
                  {service.excludes[lang].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                      <X size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/*
              El cotizador calcula kilómetros, así que aparece en el
              servicio que se cobra por kilómetro y no en el que va por
              horas. Si mañana hay un tercero por distancia, lo hereda sin
              tocar nada aquí.
            */}
            {service.priceUnitCode === 'KMT' && <QuoteCalculator service={service.name} />}

            <section className="rounded-3xl border border-line bg-surface p-6 lg:p-7">
              <h2 className="text-xl font-semibold">{es ? 'Cómo funciona' : 'How it works'}</h2>
              <ul className="mt-5 space-y-3">
                {service.highlights[lang].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 leading-relaxed">
                    <Check size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Avisos: lo que evita una conversación de ida y vuelta. */}
            <section className="rounded-3xl border border-gold-line bg-gold-pale p-6 lg:p-7">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gold-ink">
                <AlertCircle size={19} aria-hidden="true" />
                {es ? 'Antes de escribirnos' : 'Before you write'}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {service.notes[lang].map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-gold-ink">{item}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* Columna de decisión: precio, vehículo y cotización. */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
              {service.priceFromUsd === null ? (
                <p className="text-2xl font-bold leading-tight">{service.priceUnit[lang]}</p>
              ) : (
                <p className="flex items-baseline gap-1.5">
                  <span className="text-sm text-muted">{es ? 'Desde' : 'From'}</span>
                  <strong className="text-4xl font-extrabold leading-none">${service.priceFromUsd}</strong>
                  <span className="text-sm text-muted">{service.priceUnit[lang]}</span>
                </p>
              )}
              {service.priceNote && <p className="mt-2 text-sm text-muted">{service.priceNote[lang]}</p>}

              <div className="mt-5">
                <QuoteActions service={service.name} lang={lang} source="servicio" size="lg" />
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                <Clock size={13} aria-hidden="true" />
                {es ? 'Respondemos el mismo día.' : 'We reply the same day.'}
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              {/* Recortada sobre fondo transparente: ver services-section. */}
              <Picture
                src={vehicle.image.src}
                sizes="(min-width: 1024px) 28vw, 100vw"
                alt={vehicle.image.alt[lang]}
                loading="lazy"
                decoding="async"
                width={800}
                height={489}
                className="aspect-[16/10] w-full bg-surface-soft object-contain p-3"
              />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">
                  {es ? 'El vehículo' : 'The vehicle'}
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {vehicle.kind[lang]} {vehicle.model}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  <li className="flex items-center gap-2">
                    <Users size={15} className="text-faint" aria-hidden="true" />
                    {es ? `Hasta ${vehicle.seats} pasajeros` : `Up to ${vehicle.seats} passengers`}
                  </li>
                  <li className="flex items-center gap-2">
                    <Snowflake size={15} className="text-faint" aria-hidden="true" />
                    {es ? 'Aire acondicionado' : 'Air conditioning'}
                  </li>
                </ul>
                {vehicle.illustration && (
                  <p className="mt-3 text-xs text-faint">
                    {es
                      ? 'Ilustración de referencia del modelo del servicio.'
                      : 'Reference illustration of the service vehicle.'}
                  </p>
                )}
              </div>
            </div>

            {/* Complemento de los dos servicios, no un servicio aparte. */}
            <div className="rounded-3xl border border-line bg-surface-mint p-5">
              <p className="flex items-center gap-2 font-semibold">
                <Languages size={17} className="text-accent" aria-hidden="true" />
                {guideAddOn.name[lang]}
              </p>
              <p className="mt-1 text-sm text-muted">{guideAddOn.description[lang]}</p>
              <p className="mt-3 text-sm font-bold">
                ${guideAddOn.priceUsd} <span className="font-semibold text-muted">{guideAddOn.unit[lang]}</span>
              </p>
            </div>
          </aside>
        </div>

        {/* El otro servicio: son dos, así que se nombra el que falta. */}
        <section className="mt-12 rounded-3xl border border-line bg-surface p-6 lg:p-7">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">
            {es ? '¿Buscabas otra cosa?' : 'Looking for something else?'}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{other.name}</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{other.summary[lang]}</p>
            </div>
            <Link
              href={`/servicios/${other.id}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2.5 text-sm font-bold transition hover:bg-surface-mint"
            >
              {es ? 'Ver servicio' : 'See service'}
              <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}
