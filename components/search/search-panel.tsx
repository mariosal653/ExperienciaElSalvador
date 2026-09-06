'use client'

import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { DestinationField } from './destination-field'
import { DateField } from './date-field'
import { TravelersField } from './travelers-field'
import { emptyCriteria, type Locale, type SearchCriteria } from '@/lib/data'

type Props = {
  /** Criterios aplicados actualmente, para reflejarlos al limpiar. */
  applied: SearchCriteria | null
  onSearch: (criteria: SearchCriteria) => void
  lang: Locale
}

/**
 * Buscador principal.
 *
 * Mantiene un borrador editable; solo al pulsar «Buscar» se aplican los
 * criterios. Es el comportamiento que espera cualquiera que haya usado una
 * plataforma de reservas: escribir sin que los resultados salten solos.
 */
export function SearchPanel({ applied, onSearch, lang }: Props) {
  const [draft, setDraft] = useState<SearchCriteria>(applied ?? emptyCriteria)

  function submit(event: FormEvent) {
    event.preventDefault()
    onSearch(draft)
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label={lang === 'ES' ? 'Buscar experiencias' : 'Search experiences'}
      className="mt-10 grid max-w-5xl gap-2 rounded-2xl bg-white p-2 shadow-2xl md:grid-cols-[1.4fr_1fr_1.1fr_auto] md:rounded-full md:p-2"
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
        className="flex items-center justify-center gap-2 rounded-xl bg-[#b8481c] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#963b18] md:rounded-full"
      >
        <Search size={18} aria-hidden="true" />
        {lang === 'ES' ? 'Buscar' : 'Search'}
      </button>
    </form>
  )
}
