'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { parseLocalDate, toIsoDate, type Locale } from '@/lib/data'

const MONTHS: Record<Locale, string[]> = {
  ES: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/** Lunes primero, como es costumbre en El Salvador. */
const WEEKDAYS: Record<Locale, string[]> = {
  ES: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  EN: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const leading = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array(leading).fill(null)
  for (let day = 1; day <= days; day++) cells.push(new Date(year, month, day))
  return cells
}

/**
 * Calendario en línea del checkout. Solo deja elegir los días en que sale
 * la experiencia, desde mañana y hasta un año vista. Siempre visible (sin
 * desplegable): en móvil un popover encima del teclado es incómodo.
 *
 * Mide 7 columnas de ~40 px: cabe en una pantalla de 320 px.
 */
export function DatePicker({
  value,
  onChange,
  weekdays,
  first,
  last,
  lang,
  invalid,
  describedBy,
}: {
  value: string | null
  onChange: (iso: string) => void
  weekdays: number[]
  first: string
  last: string
  lang: Locale
  invalid?: boolean
  describedBy?: string
}) {
  const firstDate = parseLocalDate(first)!
  const lastDate = parseLocalDate(last)!
  const selected = value ? parseLocalDate(value) : null

  const [cursor, setCursor] = useState(() => {
    const base = selected ?? firstDate
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor])

  const atStart = cursor.year === firstDate.getFullYear() && cursor.month === firstDate.getMonth()
  const atEnd = cursor.year === lastDate.getFullYear() && cursor.month === lastDate.getMonth()

  function move(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const es = lang === 'ES'

  return (
    <div
      className={`rounded-2xl border bg-white p-3 sm:p-4 ${invalid ? 'border-[#c0492b]' : 'border-[#dce7e1]'}`}
      aria-describedby={describedBy}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={atStart}
          aria-label={es ? 'Mes anterior' : 'Previous month'}
          className="grid h-9 w-9 place-items-center rounded-full text-[#173f45] transition hover:bg-[#eaf1ed] disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold capitalize text-[#173f45]" aria-live="polite">
          {MONTHS[lang][cursor.month]} {cursor.year}
        </p>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={atEnd}
          aria-label={es ? 'Mes siguiente' : 'Next month'}
          className="grid h-9 w-9 place-items-center rounded-full text-[#173f45] transition hover:bg-[#eaf1ed] disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="group" aria-label={es ? 'Fechas disponibles' : 'Available dates'}>
        {WEEKDAYS[lang].map((day, index) => (
          <span key={`${day}-${index}`} className="py-1 text-[11px] font-bold text-[#759096]" aria-hidden="true">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />
          const iso = toIsoDate(date)
          const operating = weekdays.includes(date.getDay())
          const enabled = operating && iso >= first && iso <= last
          const isSelected = iso === value
          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => onChange(iso)}
              aria-pressed={isSelected}
              aria-label={date.toLocaleDateString(es ? 'es-SV' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              className={`aspect-square min-h-9 rounded-full text-sm font-semibold transition ${
                isSelected
                  ? 'bg-[#173f45] text-white'
                  : enabled
                    ? 'bg-[#eaf1ed] text-[#173f45] hover:bg-[#d7e7df]'
                    : 'text-[#b7c5c1] line-through decoration-transparent'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      <p className="mt-2 flex items-center gap-2 text-[11px] text-[#6a8588]">
        <span className="inline-block h-3 w-3 rounded-full bg-[#eaf1ed]" aria-hidden="true" />
        {es ? 'Días con salida' : 'Departure days'}
      </p>
    </div>
  )
}
