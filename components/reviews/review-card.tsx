'use client'

import { Star, MapPin, BadgeCheck } from 'lucide-react'
import { SourceIcon, SOURCE_LABEL } from './platform-icons'
import type { Review } from '@/lib/reviews/types'
import type { Locale } from '@/lib/data'
import { avatarColorFor } from '@/lib/reviews/seed-data'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatDate(iso: string | null, lang: Locale): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(lang === 'ES' ? 'es-SV' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ReviewCard({ review, lang }: { review: Review; lang: Locale }) {
  const date = review.relativeTime ?? formatDate(review.publishedAt, lang)

  return (
    <article className="flex h-full min-w-[17rem] max-w-[22rem] shrink-0 snap-start flex-col rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(26,65,69,.08)] sm:min-w-[19rem]">
      <header className="flex items-start gap-3">
        {review.authorPhoto ? (
          <img
            src={review.authorPhoto}
            alt=""
            loading="lazy"
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          // Avatar generado localmente: iniciales sobre un color estable
          // derivado del nombre. Sin red, sin servicios de terceros y sin
          // fotos de personas que no dieron su consentimiento.
          <span
            aria-hidden="true"
            style={{ backgroundColor: avatarColorFor(review.authorName) }}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          >
            {initials(review.authorName)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#173f45]">{review.authorName}</p>
          {date && <p className="text-xs text-[#6a8588]">{date}</p>}
        </div>

        <span
          title={SOURCE_LABEL[review.source]}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#dce7e1] bg-white"
        >
          <SourceIcon source={review.source} className="h-3.5 w-3.5" />
          <span className="sr-only">{SOURCE_LABEL[review.source]}</span>
        </span>
      </header>

      {review.rating !== null && (
        <div
          className="mt-3 flex items-center gap-0.5"
          aria-label={`${review.rating} ${lang === 'ES' ? 'de 5 estrellas' : 'out of 5 stars'}`}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={15}
              aria-hidden="true"
              className={star <= Math.round(review.rating ?? 0) ? 'text-[#f4b942]' : 'text-[#dce7e1]'}
              fill={star <= Math.round(review.rating ?? 0) ? '#f4b942' : 'none'}
            />
          ))}
        </div>
      )}

      {review.experienceTitle && (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-[#173f45]">
          <MapPin size={13} className="mt-0.5 shrink-0 text-[#b8481c]" aria-hidden="true" />
          <span>{review.experienceTitle}</span>
        </p>
      )}

      <p className="mt-2.5 line-clamp-6 text-sm leading-relaxed text-[#547176]">{review.text}</p>

      {review.verified && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#2f7d63]">
          <BadgeCheck size={13} aria-hidden="true" />
          {lang === 'ES' ? 'Opinión verificada' : 'Verified review'}
        </p>
      )}

      {review.permalink && (
        <a
          href={review.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-xs font-bold text-[#b8481c] underline-offset-4 hover:underline"
        >
          {lang === 'ES' ? 'Ver en ' : 'View on '}
          {SOURCE_LABEL[review.source]}
        </a>
      )}
    </article>
  )
}
