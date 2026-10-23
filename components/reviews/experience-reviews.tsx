'use client'

import { useEffect, useState } from 'react'
import { MessageSquareText, Star } from 'lucide-react'
import { ReviewCard } from './review-card'
import type { Locale } from '@/lib/data'
import type { ExperienceRating, Review } from '@/lib/reviews/types'

/**
 * Opiniones de UNA experiencia, con su media y el desglose por estrellas.
 *
 * Solo muestra lo que está publicado para esta experiencia: si no hay
 * opiniones lo dice, en lugar de rellenar con las de otras.
 */
export function ExperienceReviews({
  experienceId,
  rating,
  lang,
}: {
  experienceId: string
  rating: ExperienceRating | undefined
  lang: Locale
}) {
  const es = lang === 'ES'
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    let active = true
    setReviews(null)
    fetch(`/api/reviews?experience=${encodeURIComponent(experienceId)}&locale=${lang}`)
      .then((response) => (response.ok ? response.json() : { reviews: [] }))
      .then((payload: { reviews?: Review[] }) => {
        if (active) setReviews(payload.reviews ?? [])
      })
      .catch(() => {
        if (active) setReviews([])
      })
    return () => {
      active = false
    }
  }, [experienceId, lang])

  const count = rating?.count ?? 0

  return (
    <section id="opiniones-experiencia" className="mt-14 scroll-mt-24" aria-labelledby="experience-reviews-title">
      <h2 id="experience-reviews-title" className="text-xl font-semibold">
        {es ? 'Opiniones de viajeros' : 'Traveler reviews'}
      </h2>

      {count > 0 && rating && (
        <div className="mt-5 grid gap-6 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
          <div className="text-center sm:text-left">
            <p className="text-5xl font-semibold leading-none">{rating.average.toFixed(1)}</p>
            <div className="mt-2 flex justify-center gap-0.5 sm:justify-start" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={star <= Math.round(rating.average) ? 'text-gold' : 'text-line'}
                  fill={star <= Math.round(rating.average) ? '#f4b942' : 'none'}
                />
              ))}
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {count} {es ? (count === 1 ? 'opinión' : 'opiniones') : count === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          <ul className="grid gap-1.5" aria-label={es ? 'Desglose por estrellas' : 'Rating breakdown'}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const amount = rating.breakdown[stars - 1]
              const pct = count > 0 ? Math.round((amount / count) * 100) : 0
              return (
                <li key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 text-muted">
                    {stars} {es ? (stars === 1 ? 'estrella' : 'estrellas') : stars === 1 ? 'star' : 'stars'}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-mint">
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-6 shrink-0 text-right font-semibold text-brand">{amount}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {reviews === null && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2" aria-hidden="true">
          {[0, 1].map((index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-white/80" />
          ))}
        </div>
      )}

      {reviews !== null && reviews.length > 0 && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} lang={lang} />
          ))}
        </div>
      )}

      {reviews !== null && reviews.length === 0 && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-line bg-white p-5">
          <MessageSquareText size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="font-semibold">{es ? 'Todavía no hay opiniones de esta experiencia.' : 'No reviews for this experience yet.'}</p>
            <p className="mt-1 text-sm text-muted">
              {es
                ? 'Solo pueden opinar quienes la reservaron y la completaron, desde su cuenta.'
                : 'Only travelers who booked and completed it can review it, from their account.'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
