'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { CarFront, Compass, Search, Route } from 'lucide-react'
import { DestinationField } from './destination-field'
import { DateField } from './date-field'
import { TravelersField } from './travelers-field'
import { emptyCriteria, type Locale, type SearchCriteria } from '@/lib/data'
import { trackSearch } from '@/lib/analytics'

type Props = {
  /** Criterios aplicados actualmente, para reflejarlos al limpiar. */
  applied: SearchCriteria | null
  onSearch: (criteria: SearchCriteria) => void
  lang: Locale
}

/**
 * Pestañas del buscador: qué se está buscando.
 *
 * La primera es el buscador de experiencias que vive aquí mismo; las otras
 * dos llevan a la página del servicio, que tiene su propio cotizador. Es la
 * misma idea que usan los buscadores de viaje (vuelos / hoteles / autos):
 * desde el primer vistazo se ve que la casa vende tres cosas, no una.
 */
const TABS = [
  { id: 'driver-by-tour', label: 'Driver by Tour', icon: Route },
  { id: 'personal-driver', label: 'Personal Driver', icon: CarFront },
] as const

/**
 * Buscador principal.
 *
 * Mantiene un borrador editable; solo al pulsar «Buscar» se aplican los
 * criterios. Es el comportamiento que espera cualquiera que haya usado una
 * plataforma de reservas: escribir sin que los resultados salten solos.
 */
export function SearchPanel({ applied, onSearch, lang }: Props) {
  const [draft, setDraft] = useState<SearchCriteria>(applied ?? emptyCriteria)
  const es = lang === 'ES'

  function submit(event: FormEvent) {
    event.preventDefault()
    trackSearch(draft)
    onSearch(draft)
  }

  return (
    <div className="mt-9 max-w-5xl">
      {/*
        Fila de pestañas. Sobre la foto del héroe, así que la inactiva va
        traslúcida con borde claro: sin fondo propio el texto blanco se
        pierde en las zonas claras de la imagen.
      */}
      <nav
        aria-label={es ? 'Qué quieres reservar' : 'What do you want to book'}
        className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
      >
        <span
          aria-current="page"
          className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-lg"
        >
          <Compass size={16} aria-hidden="true" />
          {es ? 'Experiencias' : 'Experiences'}
        </span>

        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              href={`/servicios/${tab.id}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/70 hover:bg-white/25"
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <form
        onSubmit={submit}
        role="search"
        aria-label={es ? 'Buscar experiencias' : 'Search experiences'}
        className="grid gap-2 rounded-2xl bg-white p-2 shadow-2xl md:grid-cols-[1.5fr_1fr_1.15fr_auto]"
      >
        <DestinationField
          value={draft.destination}
          onChange={(destination) => setDraft((current) => ({ ...current, destination }))}
          lang={lang}
        />

        <DateField
          value={draft.date}
          onChange={(date) => setDraft((current) => ({ ...current, date }))}
          lang={lang}
        />

        <TravelersField
          value={draft.people}
          onChange={(people) => setDraft((current) => ({ ...current, people }))}
          lang={lang}
        />

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-bold text-white transition hover:bg-accent-dark md:py-0"
        >
          <Search size={18} aria-hidden="true" />
          {es ? 'Buscar' : 'Search'}
        </button>
      </form>
    </div>
  )
}
