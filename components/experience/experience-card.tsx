'use client'

import { CalendarCheck, Clock, Heart, MapPin, ShieldCheck } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { RatingBadge } from '@/components/reviews/rating-badge'
import { experienceName, type Experience, type Locale } from '@/lib/data'
import { departureLabel, nextDepartures } from '@/lib/departures'
import { FREE_CANCELLATION_HOURS } from '@/lib/experience-details'
import type { ReviewStats } from '@/lib/reviews/types'

/**
 * Tarjeta de experiencia del catálogo. La usan el inicio y las páginas de
 * destino, para que las dos muestren exactamente lo mismo.
 *
 * Orden de lectura, de más a menos peso: foto → nombre → precio. Todo lo
 * demás (ubicación, duración, cancelación, salida) es apoyo y va en gris:
 * si un dato de apoyo pesa más que el nombre, la cuadrícula se vuelve
 * ilegible de un vistazo.
 */
export function ExperienceCard({
  item,
  lang,
  stats,
  now,
  saved,
  onToggleSave,
  bookQuery,
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
}) {
  const es = lang === 'ES'
  const name = experienceName(item, lang)
  const next = now ? nextDepartures(item.weekdays, 1, now)[0] : undefined
  const detailHref = `/experiences/${item.id}`
  const bookHref = `/checkout/${item.id}${bookQuery ? `?${bookQuery}` : ''}`

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      {/*
        Proporción fija para todas las tarjetas: las fotos del catálogo van
        de 4:3 a 2:3 y, con una altura suelta, la cuadrícula se descuadraba
        al cambiar de filtro.
      */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-mint">
        <a href={detailHref} tabIndex={-1} aria-hidden="true" className="block h-full">
          <Picture
            src={item.image}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            alt={item.imageAlt[lang]}
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </a>
        {/* Degradado inferior: sin él, las fotos claras dejan la etiqueta y el corazón sin contraste. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(14_48_53/0.28)_0%,transparent_38%)]" />
        {item.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-bold text-brand shadow-sm">
            {item.tag[lang]}
          </span>
        )}
        <button
          onClick={() => onToggleSave(item.id)}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-brand shadow-sm backdrop-blur-sm transition hover:scale-110 hover:bg-surface"
          aria-label={`${es ? 'Guardar' : 'Save'} ${name}`}
        >
          <Heart size={17} fill={saved ? 'var(--color-accent)' : 'none'} className={saved ? 'text-accent' : ''} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={13} className="shrink-0 text-faint" aria-hidden="true" />
            <span className="truncate">{item.destination}</span>
          </span>
          <RatingBadge rating={stats?.[item.id]} loading={stats === undefined} lang={lang} />
        </div>

        <h3 className="text-lg font-bold leading-snug text-brand">
          <a href={detailHref} className="transition hover:text-accent">{name}</a>
        </h3>

        {/* Apoyo: dos datos en una sola línea de chips, no cuatro renglones. */}
        <ul className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
          <li className="flex items-center gap-1 rounded-full bg-surface-soft px-2 py-1 text-muted">
            <Clock size={12} aria-hidden="true" />
            {item.durationHours} {es ? 'horas' : 'hours'}
          </li>
          <li className="flex items-center gap-1 rounded-full bg-surface-soft px-2 py-1 text-muted">
            {es ? 'Guía local' : 'Local guide'}
          </li>
          <li className="flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-success">
            <ShieldCheck size={12} aria-hidden="true" />
            {es ? `Cancela gratis ${FREE_CANCELLATION_HOURS} h antes` : `Free cancellation ${FREE_CANCELLATION_HOURS} h before`}
          </li>
        </ul>

        {/* Lo que más mueve a reservar: cuándo sale la próxima. Va solo. */}
        <p className="mt-2.5 flex min-h-4 items-center gap-1.5 text-xs text-muted">
          <CalendarCheck size={13} className="text-faint" aria-hidden="true" />
          {next ? (
            <span>{es ? 'Próxima salida: ' : 'Next departure: '}<strong className="font-semibold text-brand">{departureLabel(next, lang, now ?? undefined)}</strong></span>
          ) : (
            <span className="h-3 w-24 animate-pulse rounded-full bg-surface-mint" aria-hidden="true" />
          )}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
          <span className="flex items-baseline gap-1">
            <span className="text-[11px] text-muted">{es ? 'Desde' : 'From'}</span>
            <strong className="text-xl font-extrabold leading-none text-brand">${item.priceUsd}</strong>
            <span className="text-[11px] text-muted">{es ? '/ persona' : '/ person'}</span>
          </span>
          <a
            href={bookHref}
            className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-accent-dark"
          >
            {es ? 'Reservar' : 'Book Now'}
          </a>
        </div>
      </div>
    </article>
  )
}
