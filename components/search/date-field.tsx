'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePopover } from '@/hooks/use-popover'
import { parseLocalDate, toIsoDate, type Locale } from '@/lib/data'

type Props = {
  value: string | null
  onChange: (value: string | null) => void
  lang: Locale
}

const MONTHS: Record<Locale, string[]> = {
  ES: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/** El calendario empieza en lunes, como es costumbre en El Salvador. */
const WEEKDAYS: Record<Locale, string[]> = {
  ES: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  EN: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Días de la cuadrícula del mes, con huecos al inicio para alinear el
 * primer día con su columna. `null` = celda vacía.
 */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  // getDay(): 0 = domingo. La cuadrícula empieza en lunes, así que se rota.
  const leading = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = Array(leading).fill(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day))
  }
  return cells
}

export function DateField({ value, onChange, lang }: Props) {
  const { open, setOpen, close, containerRef } = usePopover<HTMLDivElement>()

  const today = useMemo(() => startOfDay(new Date()), [])
  const selected = value ? parseLocalDate(value) : null

  const [cursor, setCursor] = useState(() => {
    const base = selected ?? today
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])

  // No se puede retroceder más allá del mes en curso.
  const atCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth()

  function move(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  function pick(date: Date) {
    onChange(toIsoDate(date))
    close()
  }

  const summary = selected
    ? `${selected.getDate()} ${MONTHS[lang][selected.getMonth()].slice(0, 3)}`
    : lang === 'ES'
      ? 'Cualquier fecha'
      : 'Any date'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={lang === 'ES' ? 'Elegir fecha' : 'Choose date'}
        className="flex w-full items-center gap-3 rounded-xl border-t border-[#e5ece9] px-4 py-3 text-left md:border-l md:border-t-0"
      >
        <CalendarDays className="shrink-0 text-[#ee7f47]" size={19} aria-hidden="true" />
        <span>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#759096]">
            {lang === 'ES' ? 'Cuándo' : 'When'}
          </span>
          <span className="text-sm font-semibold text-[#173f45]">{summary}</span>
        </span>
      </button>

      {/* El z-30 de este panel es LOCAL: solo compite con sus hermanos.
          Quien decide que tape a la tira de categorias es la capa 30 del
          contenido del heroe. Escala completa en app/globals.css. */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+.5rem)] z-30 w-[19.5rem] rounded-2xl border border-[#e5ece9] bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={atCurrentMonth}
              aria-label={lang === 'ES' ? 'Mes anterior' : 'Previous month'}
              className="grid h-8 w-8 place-items-center rounded-full text-[#173f45] transition hover:bg-[#eaf1ed] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={17} />
            </button>

            <span aria-live="polite" className="text-sm font-semibold capitalize text-[#173f45]">
              {MONTHS[lang][cursor.month]} {cursor.year}
            </span>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label={lang === 'ES' ? 'Mes siguiente' : 'Next month'}
              className="grid h-8 w-8 place-items-center rounded-full text-[#173f45] transition hover:bg-[#eaf1ed]"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS[lang].map((day, index) => (
              <span
                key={`${day}-${index}`}
                aria-hidden="true"
                className="grid h-8 place-items-center text-[11px] font-bold uppercase text-[#759096]"
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />

              const iso = toIsoDate(date)
              const isPast = date < today
              const isSelected = value === iso
              const isToday = iso === toIsoDate(today)

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => pick(date)}
                  aria-label={`${date.getDate()} ${MONTHS[lang][date.getMonth()]} ${date.getFullYear()}`}
                  aria-current={isToday ? 'date' : undefined}
                  className={`grid h-9 place-items-center rounded-full text-sm transition ${
                    isSelected
                      ? 'bg-[#173f45] font-bold text-white'
                      : isPast
                        ? 'cursor-not-allowed text-[#c3d1cd]'
                        : isToday
                          ? 'font-bold text-[#b8481c] hover:bg-[#eaf1ed]'
                          : 'text-[#173f45] hover:bg-[#eaf1ed]'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(null)
              close()
            }}
            className="mt-3 w-full rounded-full border border-[#dce7e1] py-2 text-xs font-bold text-[#173f45] transition hover:bg-[#eaf1ed]"
          >
            {lang === 'ES' ? 'Cualquier fecha' : 'Any date'}
          </button>
        </div>
      )}
    </div>
  )
}
