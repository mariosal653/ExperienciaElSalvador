'use client'

import { Sparkles, Star } from 'lucide-react'
import type { Locale } from '@/lib/data'
import type { ExperienceRating } from '@/lib/reviews/types'

/**
 * Estrellas de una experiencia con su número de opiniones reales. Sin
 * opiniones muestra «Nueva»: nunca una cifra que el visitante no pueda
 * comprobar leyendo las opiniones.
 */
export function RatingBadge({
  rating,
  loading,
  lang,
  size = 'sm',
}: {
  rating: ExperienceRating | undefined
  loading: boolean
  lang: Locale
  size?: 'sm' | 'md'
}) {
  const es = lang === 'ES'
  const icon = size === 'md' ? 15 : 13
  const text = size === 'md' ? 'text-sm' : 'text-xs'

  if (loading) {
    return <span className={`inline-block h-4 w-16 animate-pulse rounded-full bg-surface-mint ${text}`} aria-hidden="true" />
  }

  if (!rating || rating.count === 0) {
    return (
      <span className={`flex items-center gap-1 font-semibold text-success ${text}`}>
        <Sparkles size={icon} aria-hidden="true" />
        {es ? 'Nueva' : 'New'}
      </span>
    )
  }

  const label = es
    ? `${rating.average.toFixed(1)} de 5, ${rating.count} ${rating.count === 1 ? 'opinión' : 'opiniones'}`
    : `${rating.average.toFixed(1)} out of 5, ${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}`

  return (
    <span className={`flex items-center gap-1 font-semibold text-brand ${text}`} aria-label={label}>
      <Star size={icon} fill="#f4b942" className="text-gold" aria-hidden="true" />
      <span aria-hidden="true">
        {rating.average.toFixed(1)}{' '}
        <span className="font-normal text-muted">
          ({size === 'md' ? label.split(', ')[1] : rating.count})
        </span>
      </span>
    </span>
  )
}
