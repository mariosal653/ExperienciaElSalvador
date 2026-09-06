'use client'

import { Minus, Plus, Users } from 'lucide-react'
import type { Locale } from '@/lib/data'

const MIN_PEOPLE = 1
const MAX_PEOPLE = 20

type Props = {
  value: number
  onChange: (value: number) => void
  lang: Locale
}

/**
 * Selector de viajeros con controles − y +.
 *
 * Los controles van en línea, siempre visibles: en móvil un desplegable
 * extra sería un toque de más para algo que se resuelve con dos botones.
 * El valor vive en el estado del buscador, así que se conserva aunque se
 * abran y cierren el calendario o el selector de destino.
 */
export function TravelersField({ value, onChange, lang }: Props) {
  const label = lang === 'ES' ? 'Viajeros' : 'Travelers'
  const people = lang === 'ES' ? (value === 1 ? 'persona' : 'personas') : value === 1 ? 'person' : 'people'

  const decrease = () => onChange(Math.max(MIN_PEOPLE, value - 1))
  const increase = () => onChange(Math.min(MAX_PEOPLE, value + 1))

  return (
    <div className="flex items-center gap-3 rounded-xl border-t border-[#e5ece9] px-4 py-3 md:border-l md:border-t-0">
      <Users className="shrink-0 text-[#ee7f47]" size={19} aria-hidden="true" />
      <span className="flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-[#759096]">{label}</span>

        <span className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={decrease}
            disabled={value <= MIN_PEOPLE}
            aria-label={lang === 'ES' ? 'Quitar un viajero' : 'Remove one traveler'}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#dce7e1] text-[#173f45] transition hover:border-[#173f45] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Minus size={14} />
          </button>

          <span
            aria-live="polite"
            className="min-w-[4.5rem] text-center text-sm font-semibold text-[#173f45] md:min-w-[5.5rem]"
          >
            {value} <span className="font-normal text-[#547176]">{people}</span>
          </span>

          <button
            type="button"
            onClick={increase}
            disabled={value >= MAX_PEOPLE}
            aria-label={lang === 'ES' ? 'Agregar un viajero' : 'Add one traveler'}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#dce7e1] text-[#173f45] transition hover:border-[#173f45] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Plus size={14} />
          </button>
        </span>
      </span>
    </div>
  )
}
