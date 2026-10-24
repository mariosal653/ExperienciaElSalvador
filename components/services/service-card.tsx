'use client'

import Link from 'next/link'
import { ArrowRight, Car, Check, Route } from 'lucide-react'
import { QuoteActions } from '@/components/services/quote-actions'
import type { Locale } from '@/lib/data'
import type { Service } from '@/lib/services'

/** Iconos de los servicios, resueltos por clave (como la tira de categorías). */
const ICONS = { route: Route, car: Car } as const

/**
 * Tarjeta de un servicio de conductor.
 *
 * Pesa más que una tarjeta de experiencia a propósito: es la oferta que el
 * acuerdo manda poner delante. Orden de lectura: nombre → qué es → precio
 * → cotizar. Los detalles finos viven en la página del servicio, para que
 * la tarjeta no se convierta en una ficha técnica.
 */
export function ServiceCard({ service, lang }: { service: Service; lang: Locale }) {
  const es = lang === 'ES'
  const Icon = ICONS[service.icon]

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover lg:p-7">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-mint text-brand">
          <Icon size={24} strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-2xl font-semibold tracking-tight text-brand">
            <Link href={`/servicios/${service.id}`} className="transition hover:text-accent">
              {service.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm font-semibold text-accent-deep">{service.tagline[lang]}</p>
        </div>
      </div>

      <p className="mt-5 leading-relaxed text-muted">{service.summary[lang]}</p>

      <ul className="mt-5 space-y-2">
        {service.highlights[lang].map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-brand">
            <Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>

      {/* mt-auto: las dos tarjetas alinean precio y botones aunque los textos midan distinto. */}
      <div className="mt-auto pt-6">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t border-line-soft pt-4">
          <span className="flex items-baseline gap-1.5">
            {service.priceFromUsd === null ? (
              <strong className="text-lg font-bold leading-none text-brand">{service.priceUnit[lang]}</strong>
            ) : (
              <>
                <span className="text-xs text-muted">{es ? 'Desde' : 'From'}</span>
                <strong className="text-3xl font-extrabold leading-none text-brand">${service.priceFromUsd}</strong>
                <span className="text-xs text-muted">{service.priceUnit[lang]}</span>
              </>
            )}
          </span>
          <Link
            href={`/servicios/${service.id}`}
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand underline-offset-4 transition hover:text-accent hover:underline"
          >
            {es ? 'Ver detalles' : 'See details'}
            <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        {service.priceNote && <p className="mt-2 text-xs text-muted">{service.priceNote[lang]}</p>}

        <div className="mt-5">
          <QuoteActions service={service.name} lang={lang} source="home" />
        </div>
      </div>
    </article>
  )
}
