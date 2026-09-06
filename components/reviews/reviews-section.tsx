'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { ReviewCard } from './review-card'
import { GoogleIcon, FacebookIcon, TikTokIcon } from './platform-icons'
import { useLanguage } from '@/components/i18n/language-provider'
import type { ReviewsPayload } from '@/lib/reviews/types'

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
  const trackRef = useRef<HTMLDivElement>(null)

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

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * (track.clientWidth * 0.8), behavior: 'smooth' })
  }

  const reviews = data?.reviews ?? []
  const summary = data?.summary ?? null
  const hasReviews = reviews.length > 0

  return (
    <section id="opiniones" className="bg-[#eaf1ed] py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">
              {es ? 'Lo que dicen' : 'What people say'}
            </p>
            <h2 className="max-w-lg text-3xl font-semibold tracking-tight md:text-4xl">
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

          {summary && summary.averageRating !== null && (
            <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_8px_30px_rgba(26,65,69,.08)]">
              <div>
                <p className="text-3xl font-semibold leading-none text-[#173f45]">
                  {summary.averageRating.toFixed(1)}
                </p>
                <div className="mt-1.5 flex items-center gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= Math.round(summary.averageRating ?? 0) ? 'text-[#f4b942]' : 'text-[#dce7e1]'}
                      fill={star <= Math.round(summary.averageRating ?? 0) ? '#f4b942' : 'none'}
                    />
                  ))}
                </div>
              </div>
              <div className="border-l border-[#dce7e1] pl-4">
                <GoogleIcon className="h-5 w-5" />
                <p className="mt-1.5 text-xs text-[#6a8588]">
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
                className="h-52 min-w-[17rem] flex-1 animate-pulse rounded-2xl bg-white/70 sm:min-w-[19rem]"
              />
            ))}
          </div>
        )}

        {!loading && hasReviews && (
          <>
            <div className="relative">
              <div
                ref={trackRef}
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {reviews.map((review) => (
                  <ReviewCard key={`${review.source}-${review.id}`} review={review} lang={lang} />
                ))}
              </div>

              {reviews.length > 2 && (
                <div className="mt-4 hidden justify-end gap-2 md:flex">
                  <button
                    type="button"
                    onClick={() => scrollBy(-1)}
                    aria-label={es ? 'Opiniones anteriores' : 'Previous reviews'}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[#dce7e1] bg-white text-[#173f45] transition hover:bg-[#f4f7f5]"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollBy(1)}
                    aria-label={es ? 'Más opiniones' : 'More reviews'}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[#dce7e1] bg-white text-[#173f45] transition hover:bg-[#f4f7f5]"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {summary?.profileUrl && (
              <div className="mt-8">
                <a
                  href={summary.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#173f45] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0e3035]"
                >
                  <GoogleIcon className="h-4 w-4" />
                  {es ? 'Ver todas las opiniones en Google' : 'View all reviews on Google'}
                  <ArrowRight size={16} />
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
    <div className="rounded-2xl border border-dashed border-[#b7c5c1] bg-white/70 p-8 text-center md:p-12">
      <div className="mx-auto flex w-fit items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
        <GoogleIcon className="h-5 w-5" />
        <span className="h-4 w-px bg-[#dce7e1]" />
        <FacebookIcon className="h-5 w-5 opacity-35" />
        <span className="h-4 w-px bg-[#dce7e1]" />
        <TikTokIcon className="h-5 w-5 text-[#173f45] opacity-35" />
      </div>

      <p className="mt-5 text-lg font-semibold text-[#173f45]">
        {es ? 'Las opiniones aún no están conectadas' : 'Reviews are not connected yet'}
      </p>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#6a8588]">
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
        <p className="mt-4 text-xs text-[#8aa09c]">
          {es ? 'Integración pendiente de credenciales.' : 'Integration pending credentials.'}
        </p>
      )}
    </div>
  )
}
