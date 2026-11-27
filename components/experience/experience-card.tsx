'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarCheck, Heart, ShieldCheck } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { SharedName, SharedPhoto } from '@/components/ui/shared-transition'
import { RatingBadge } from '@/components/reviews/rating-badge'
import { experienceName, isBookableOnline, type Experience, type Locale } from '@/lib/data'
import { experienceQuoteWhatsApp } from '@/lib/experience-quote'
import { departureLabel, nextDepartures } from '@/lib/departures'
import { FREE_CANCELLATION_HOURS } from '@/lib/experience-details'
import type { ReviewStats } from '@/lib/reviews/types'

/**
 * Tarjeta de experiencia del catálogo. La usan el inicio y las páginas de
 * destino, para que las dos muestren exactamente lo mismo.
 *
 * Cuatro cosas y nada más: foto → lugar y duración → nombre → precio.
 * Sin caja ni sombra: la foto es la tarjeta y el texto va debajo, como en
 * una revista. Cada dato extra (transporte, cancelación, «nueva») le
 * quitaba peso al nombre; ese detalle vive en la ficha.
 *
 * `variant="feature"` es la versión grande de los tours que se reservan
 * en línea («Imperdibles» del inicio): foto amplia, cancelación gratis y
 * próxima salida a la vista, y el botón de reservar como única acción
 * fuerte.
 */
export function ExperienceCard({
  item,
  lang,
  stats,
  now,
  saved,
  onToggleSave,
  bookQuery,
  variant = 'grid',
}: {
  item: Experience
  lang: Locale
  /** `undefined` mientras cargan las valoraciones. */
  stats: ReviewStats | null | undefined
  /** «Hoy» del navegador; null hasta montar (ver la nota en home-view). */
  now: Date | null
  saved: boolean
  onToggleSave: (id: string) => void
  /** Fecha y viajeros ya buscados, para llegar al checkout con ellos. */
  bookQuery?: string
  variant?: 'grid' | 'feature'
}) {
  const es = lang === 'ES'
  const name = experienceName(item, lang)
  const next = now ? nextDepartures(item.weekdays, 1, now)[0] : undefined
  const detailHref = `/experiences/${item.id}`
  const bookHref = `/checkout/${item.id}${bookQuery ? `?${bookQuery}` : ''}`
  /** Los dos tours del Volcán de Santa Ana se reservan aquí; el resto se cotiza por WhatsApp o correo. */
  const online = isBookableOnline(item)
  /**
   * Al pulsar, la foto y el nombre vuelan hasta la galería y el título del
   * detalle. Solo la tarjeta pulsada recibe nombre de transición: ver
   * components/ui/shared-transition.tsx. Los enlaces al detalle son <Link>
   * por eso: con un <a> normal la página se recarga y no hay transición.
   */
  const [leaving, setLeaving] = useState(false)
  const leave = () => setLeaving(true)

  const feature = variant === 'feature'
  const rating = stats?.[item.id]
  const hasRating = rating !== undefined && rating.count > 0
  const hours = `${item.durationHours} h`

  return (
    <article className="group flex flex-col">
      {/*
        Proporción fija para todas las tarjetas: las fotos del catálogo van
        de 4:3 a 2:3 y, con una altura suelta, la cuadrícula se descuadraba
        al cambiar de filtro.
      */}
      <div className={`relative overflow-hidden rounded-card bg-sand ${feature ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        <Link href={detailHref} onClick={leave} tabIndex={-1} aria-hidden="true" className="block h-full">
          <SharedPhoto name={`experiencia-foto-${item.id}`} enabled={leaving} className="h-full overflow-hidden rounded-card">
            <Picture
              src={item.image}
              sizes={feature ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'}
              alt={item.imageAlt[lang]}
              loading="lazy"
              decoding="async"
              width={feature ? 1280 : 640}
              height={feature ? 800 : 480}
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            />
          </SharedPhoto>
        </Link>
        {/* Degradado superior: sin él, las fotos claras dejan la etiqueta y el corazón sin contraste. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(14_48_53/0.32)_0%,transparent_36%)]" />
        {item.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-brand/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-white backdrop-blur-sm">
            {item.tag[lang]}
          </span>
        )}
        <button
          onClick={() => onToggleSave(item.id)}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-brand backdrop-blur-sm transition hover:bg-surface"
          aria-label={`${es ? 'Guardar' : 'Save'} ${name}`}
        >
          <Heart size={17} fill={saved ? 'var(--color-accent)' : 'none'} className={saved ? 'text-accent' : ''} />
        </button>
      </div>

      <div className={`flex flex-1 flex-col ${feature ? 'pt-5' : 'pt-4'}`}>
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="truncate">
            {item.destination} <span aria-hidden="true">·</span> {hours}
          </span>
          {/* Sin opiniones no se dice nada: «Nueva» en todas las tarjetas no informaba. */}
          {hasRating && <RatingBadge rating={rating} loading={false} lang={lang} />}
        </div>

        <SharedName name={`experiencia-nombre-${item.id}`} enabled={leaving}>
          <h3 className={`mt-1.5 font-semibold leading-snug text-brand ${feature ? 'text-2xl tracking-tight md:text-3xl' : 'text-lg'}`}>
            <Link href={detailHref} onClick={leave} className="transition hover:text-accent-deep">{name}</Link>
          </h3>
        </SharedName>

        {/*
          Solo la versión grande lleva datos de apoyo: son los tours que se
          reservan aquí, y cancelación y próxima salida son lo que más
          empuja a reservar. `mb-auto` absorbe el hueco sobrante para que el
          pie quede apoyado en el fondo y los precios de una fila se alineen.
        */}
        {feature && online ? (
          <ul className="mb-auto mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            <li className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-success" aria-hidden="true" />
              {es ? `Cancelación gratis hasta ${FREE_CANCELLATION_HOURS} h antes` : `Free cancellation up to ${FREE_CANCELLATION_HOURS} h before`}
            </li>
            <li className="flex min-h-5 items-center gap-1.5">
              <CalendarCheck size={15} className="text-faint" aria-hidden="true" />
              {next ? (
                <span>{es ? 'Próxima salida: ' : 'Next departure: '}<strong className="font-semibold text-brand">{departureLabel(next, lang, now ?? undefined)}</strong></span>
              ) : (
                <span className="h-3 w-24 animate-pulse rounded-full bg-sand" aria-hidden="true" />
              )}
            </li>
          </ul>
        ) : (
          <span className="mb-auto" />
        )}

        {/* En la cuadrícula, precio y acción en dos renglones fijos: así no saltan de línea según lo largo del precio. */}
        <div className={feature ? 'mt-5 flex flex-wrap items-center justify-between gap-3' : 'mt-2 flex flex-col items-start gap-1'}>
          {item.priceUsd === null ? (
            <strong className="text-sm font-semibold text-brand">{es ? 'Precio a consultar' : 'Price on request'}</strong>
          ) : (
            <span className="flex items-baseline gap-1">
              <span className="text-xs text-muted">{es ? 'Desde' : 'From'}</span>
              <strong className={`font-semibold leading-none text-brand ${feature ? 'text-2xl' : 'text-lg'}`}>${item.priceUsd}</strong>
              <span className="text-xs text-muted">
                {es ? '/ persona' : '/ person'}
                {!online && (es ? ' · por confirmar' : ' · to be confirmed')}
              </span>
            </span>
          )}
          {online ? (
            <a
              href={bookHref}
              className={`rounded-control bg-accent font-bold text-white transition hover:bg-accent-dark ${feature ? 'px-6 py-3 text-sm' : 'px-4 py-2.5 text-xs'}`}
            >
              {es ? 'Reservar' : 'Book now'}
            </a>
          ) : (
            // Acción secundaria: texto con flecha. El terracota sólido queda
            // para reservar, que es lo único que se cierra en la web.
            <a
              href={experienceQuoteWhatsApp(item, lang)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={es ? `Cotizar ${name} por WhatsApp` : `Get a quote for ${name} on WhatsApp`}
              className="group/quote inline-flex min-h-10 items-center gap-1 text-xs font-bold text-accent-deep"
            >
              {es ? 'Cotizar' : 'Get a quote'}
              <ArrowRight size={14} className="transition group-hover/quote:translate-x-0.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
