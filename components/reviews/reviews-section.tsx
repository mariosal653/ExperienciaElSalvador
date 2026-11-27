'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Star } from 'lucide-react'
import { GoogleIcon, FacebookIcon, TikTokIcon } from './platform-icons'
import { useLanguage } from '@/components/i18n/language-provider'
import { experienceNameById } from '@/lib/data'
import type { ReviewsPayload } from '@/lib/reviews/types'

/**
 * La nota media solo se enseña a partir de este número de opiniones. Con
 * cuatro, «4.8» llama la atención sobre lo poco que hay; las citas, en
 * cambio, convencen desde la primera.
 */
const MIN_REVIEWS_FOR_SCORE = 20

/** Citas que se muestran: pocas y grandes, como en una revista. */
const QUOTES = 3

/**
 * Sección de opiniones de clientes.
 *
 * Nunca inventa reseñas: si Google no está conectado, muestra un estado
 * vacío que lo dice con claridad. Lo que se ve aquí siempre viene de una
 * plataforma real.
 */
export function ReviewsSection() {
  const { lang } = useLanguage()
  const es = lang === 'ES'

  const [data, setData] = useState<ReviewsPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    fetch(`/api/reviews?locale=${lang}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: ReviewsPayload | null) => {
        if (active) setData(payload)
      })
      .catch(() => {
        if (active) setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [lang])

  const reviews = data?.reviews ?? []
  const summary = data?.summary ?? null
  const hasReviews = reviews.length > 0
  // Primero las que tienen texto más largo: dicen más que «¡Excelente!».
  const quotes = [...reviews].filter((review) => review.text.trim().length > 0).sort((a, b) => b.text.length - a.text.length).slice(0, QUOTES)
  const showScore =
    summary !== null && summary.averageRating !== null && summary.totalCount !== null && summary.totalCount >= MIN_REVIEWS_FOR_SCORE

  return (
    <section id="opiniones" className="section-y">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">
              {es ? 'Lo que dicen' : 'What people say'}
            </p>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
              {es ? (
                <>
                  Viajeros que ya lo <em className="font-serif font-normal">vivieron</em>
                </>
              ) : (
                <>
                  Travelers who have <em className="font-serif font-normal">been there</em>
                </>
              )}
            </h2>
          </div>

          {showScore && summary && summary.averageRating !== null && (
            <div className="flex items-center gap-4 rounded-card border border-line bg-white px-5 py-4">
              <div>
                <p className="text-3xl font-semibold leading-none text-brand">
                  {summary.averageRating.toFixed(1)}
                </p>
                <div className="mt-1.5 flex items-center gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= Math.round(summary.averageRating ?? 0) ? 'text-gold' : 'text-line'}
                      fill={star <= Math.round(summary.averageRating ?? 0) ? '#f4b942' : 'none'}
                    />
                  ))}
                </div>
              </div>
              <div className="border-l border-line pl-4">
                <GoogleIcon className="h-5 w-5" />
                <p className="mt-1.5 text-xs text-muted">
                  {summary.totalCount !== null
                    ? `${summary.totalCount} ${es ? 'opiniones' : 'reviews'}`
                    : es ? 'en Google' : 'on Google'}
                </p>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex gap-5 overflow-hidden" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-52 min-w-[17rem] flex-1 animate-pulse rounded-card bg-sand sm:min-w-[19rem]"
              />
            ))}
          </div>
        )}

        {!loading && hasReviews && (
          <>
            {/* Tres citas grandes en serif, sin carrusel: se leen de un vistazo y no esconden nada detrás de flechas. */}
            <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
              {quotes.map((review) => {
                const experience = review.experienceTitle
                  ? experienceNameById(review.experienceId, lang) ?? review.experienceTitle
                  : null
                return (
                  <li key={`${review.source}-${review.id}`} className="flex flex-col border-t border-brand/20 pt-6">
                    {review.rating !== null && (
                      <p
                        className="flex items-center gap-0.5"
                        aria-label={`${review.rating} ${es ? 'de 5 estrellas' : 'out of 5 stars'}`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            aria-hidden="true"
                            className={star <= Math.round(review.rating ?? 0) ? 'text-gold' : 'text-line'}
                            fill={star <= Math.round(review.rating ?? 0) ? '#f4b942' : 'none'}
                          />
                        ))}
                      </p>
                    )}
                    <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed text-brand md:text-xl">
                      <p className="line-clamp-[8]">{es ? `«${review.text.trim()}»` : `“${review.text.trim()}”`}</p>
                    </blockquote>
                    <p className="mt-6 text-sm font-semibold text-brand">{review.authorName}</p>
                    {experience && <p className="mt-0.5 text-xs text-muted">{experience}</p>}
                  </li>
                )
              })}
            </ul>

            {summary?.profileUrl && (
              <div className="mt-12">
                <a
                  href={summary.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-control border border-brand/30 px-5 py-3 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
                >
                  <GoogleIcon className="h-4 w-4" />
                  {es ? 'Ver todas las opiniones en Google' : 'View all reviews on Google'}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            )}
          </>
        )}

        {!loading && !hasReviews && <NotConnected es={es} payload={data} />}
      </div>
    </section>
  )
}

/**
 * Estado vacío. Deliberadamente sin reseñas de ejemplo: mostrar opiniones
 * inventadas en una página que vende confianza es justo lo contrario de lo
 * que esta sección debe conseguir.
 */
function NotConnected({ es, payload }: { es: boolean; payload: ReviewsPayload | null }) {
  const google = payload?.providers.find((provider) => provider.source === 'google')

  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-white/70 p-8 text-center md:p-12">
      <div className="mx-auto flex w-fit items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
        <GoogleIcon className="h-5 w-5" />
        <span className="h-4 w-px bg-line" />
        <FacebookIcon className="h-5 w-5 opacity-35" />
        <span className="h-4 w-px bg-line" />
        <TikTokIcon className="h-5 w-5 text-brand opacity-35" />
      </div>

      <p className="mt-5 text-lg font-semibold text-brand">
        {es ? 'Las opiniones aún no están conectadas' : 'Reviews are not connected yet'}
      </p>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
        {es
          ? 'Esta sección mostrará opiniones reales de Google en cuanto se agreguen las credenciales. No se muestran reseñas de ejemplo a propósito: en una página que vende confianza, una opinión inventada vale menos que un espacio vacío.'
          : 'This section will show real Google reviews as soon as the credentials are added. No sample reviews are shown on purpose: on a page that sells trust, a made-up review is worth less than an empty space.'}
      </p>

      {/*
        El motivo tecnico NO se muestra al visitante: decia cosas como
        «Faltan GOOGLE_PLACES_API_KEY», que es filtrar detalles internos a
        cualquiera que entre. Sigue disponible en /api/reviews para quien
        configure la integracion.
      */}
      {google && !google.configured && (
        <p className="mt-4 text-xs text-muted">
          {es ? 'Integración pendiente de credenciales.' : 'Integration pending credentials.'}
        </p>
      )}
    </div>
  )
}
