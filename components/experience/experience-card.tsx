'use client'

import { CalendarCheck, Heart, MapPin, ShieldCheck } from 'lucide-react'
import { Picture } from '@/components/ui/picture'
import { RatingBadge } from '@/components/reviews/rating-badge'
import { experienceName, type Experience, type Locale } from '@/lib/data'
import { departureLabel, nextDepartures } from '@/lib/departures'
import { FREE_CANCELLATION_HOURS } from '@/lib/experience-details'
import type { ReviewStats } from '@/lib/reviews/types'

/**
 * Tarjeta de experiencia del catálogo. La usan el inicio y las páginas de
 * destino, para que las dos muestren exactamente lo mismo.
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
    <article className="group overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.08)]">
      <div className="relative h-56 overflow-hidden">
        <a href={detailHref} tabIndex={-1} aria-hidden="true" className="block h-full"><Picture src={item.image} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" alt={item.imageAlt[lang]} loading="lazy" decoding="async" width={600} height={448} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></a>
        {item.tag && <span className="absolute left-3 top-3 rounded-full bg-[#f4d27c] px-3 py-1 text-[11px] font-bold text-[#173f45]">{item.tag[lang]}</span>}
        <button
          onClick={() => onToggleSave(item.id)}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#173f45] transition hover:scale-105"
          aria-label={`${es ? 'Guardar' : 'Save'} ${name}`}
        >
          <Heart size={17} fill={saved ? '#b8481c' : 'none'} className={saved ? 'text-[#b8481c]' : ''} />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-[#6a8588]">
          <span className="flex items-center gap-1"><MapPin size={13} />{item.destination}</span>
          <RatingBadge rating={stats?.[item.id]} loading={stats === undefined} lang={lang} />
        </div>
        <h3 className="text-lg font-semibold leading-snug"><a href={detailHref} className="transition hover:text-[#b8481c]">{name}</a></h3>
        <p className="mt-2 text-xs text-[#6a8588]">{item.durationHours} {es ? 'horas · Guía local incluido' : 'hours · Local guide included'}</p>
        {/* Lo que más pesa al decidir: poder cancelar y cuándo sale. */}
        <ul className="mt-3 grid gap-1 text-xs">
          <li className="flex items-center gap-1.5 font-semibold text-[#2f7d63]">
            <ShieldCheck size={13} aria-hidden="true" />
            {es ? `Cancelación gratis hasta ${FREE_CANCELLATION_HOURS} h antes` : `Free cancellation up to ${FREE_CANCELLATION_HOURS} h before`}
          </li>
          <li className="flex min-h-4 items-center gap-1.5 text-[#547176]">
            <CalendarCheck size={13} aria-hidden="true" />
            {next ? (
              <span>{es ? 'Próxima salida: ' : 'Next departure: '}<strong className="font-semibold text-[#173f45]">{departureLabel(next, lang, now ?? undefined)}</strong></span>
            ) : (
              <span className="h-3 w-24 animate-pulse rounded-full bg-[#eaf1ed]" aria-hidden="true" />
            )}
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-[#edf0ed] pt-3">
          <span><span className="text-xs text-[#6a8588]">{es ? 'Desde' : 'From'}</span> <strong className="text-lg">${item.priceUsd}</strong> <span className="text-xs text-[#6a8588]">{es ? '/ persona' : '/ person'}</span></span>
          <a href={bookHref} className="rounded-full bg-[#b8481c] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#963b18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45]">{es ? 'Reservar' : 'Book Now'}</a>
        </div>
      </div>
    </article>
  )
}
