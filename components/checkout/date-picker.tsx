'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react'
import { parseLocalDate, toIsoDate, type Locale } from '@/lib/data'
import { formatWholeDollars, quote } from '@/lib/pricing'
import type { DayAvailability } from '@/lib/availability'

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

/** Primer día reservable en que sale la experiencia (o `from` si no hay). */
function firstDepartureFrom(from: Date, until: Date, weekdays: number[]): Date {
  const day = new Date(from)
  for (let i = 0; i < 14 && day <= until; i++) {
    if (weekdays.includes(day.getDay())) return day
    day.setDate(day.getDate() + 1)
  }
  return from
}

type Pricing = { id: string; priceUsd: number }

/**
 * Calendario en línea del checkout, con el TOTAL DEL GRUPO en cada día.
 *
 * Va debajo del selector de personas: al cambiar el grupo, el mes se
 * vuelve a pedir y cada día recalcula su total y sus plazas. Un día con
 * menos plazas libres que el grupo dice «Solo N» y no se puede elegir.
 *
 * El mes llega calculado de /api/experiences/{id}/availability. Si la
 * petición falla, el calendario sigue funcionando con los días de salida
 * del catálogo y el precio de `quote()`; las plazas las vuelve a comprobar
 * el servidor al reservar.
 *
 * El total es sin descuentos: el descuento se ve en el resumen. Mide 7
 * columnas de ~40 px: cabe en una pantalla de 320 px.
 */
export function DatePicker({
  value,
  onChange,
  experience,
  people,
  weekdays,
  first,
  last,
  lang,
  invalid,
  describedBy,
}: {
  value: string | null
  onChange: (iso: string) => void
  experience: Pricing
  people: number
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

  // Sin fecha elegida, abre en el mes de la PRIMERA salida disponible: si
  // hoy es 30 y la próxima salida es el 3, abrir en este mes obliga a
  // adivinar que hay que pasar de página.
  const [cursor, setCursor] = useState(() => {
    const base = selected ?? firstDepartureFrom(firstDate, lastDate, weekdays)
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`

  // Mes calculado por el servidor. `null` = cargando o sin respuesta.
  const [days, setDays] = useState<Map<string, DayAvailability> | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/experiences/${encodeURIComponent(experience.id)}/availability?month=${monthKey}&people=${people}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { ok?: boolean; days?: DayAvailability[] } | null) => {
        setDays(payload?.ok && payload.days ? new Map(payload.days.map((day) => [day.date, day])) : null)
      })
      .catch(() => {
        if (!controller.signal.aborted) setDays(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [experience.id, monthKey, people])

  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor])

  /** Lo que se dibuja en cada día: del servidor o, sin él, del catálogo. */
  function infoFor(iso: string, date: Date): DayAvailability {
    const fromServer = days?.get(iso)
    if (fromServer) return fromServer
    const bookable = weekdays.includes(date.getDay()) && iso >= first && iso <= last
    const price = bookable ? quote(experience, iso, people) : null
    return {
      date: iso,
      status: bookable ? 'available' : 'unavailable',
      remaining: 0,
      unitPriceCents: price?.unitPriceCents ?? null,
      totalCents: price?.totalCents ?? null,
    }
  }

  // «Precio más bajo» solo tiene sentido si los precios del mes no son
  // todos iguales; con un precio único no se marca nada.
  const lowest = useMemo(() => {
    if (!days) return null
    const totals = [...days.values()].flatMap((day) => (day.totalCents !== null ? [day.totalCents] : []))
    if (totals.length === 0) return null
    const min = Math.min(...totals)
    return totals.some((total) => total !== min) ? min : null
  }, [days])

  const atStart = cursor.year === firstDate.getFullYear() && cursor.month === firstDate.getMonth()
  const atEnd = cursor.year === lastDate.getFullYear() && cursor.month === lastDate.getMonth()

  function move(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const es = lang === 'ES'
  const locale = es ? 'es-SV' : 'en-US'

  return (
    <div
      className={`rounded-2xl border bg-white p-3 sm:p-4 ${invalid ? 'border-accent' : 'border-line'}`}
      aria-describedby={describedBy}
      aria-busy={loading}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={atStart}
          aria-label={es ? 'Mes anterior' : 'Previous month'}
          className="grid h-9 w-9 place-items-center rounded-full text-brand transition hover:bg-surface-mint disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold capitalize text-brand" aria-live="polite">
          {MONTHS[lang][cursor.month]} {cursor.year}
        </p>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={atEnd}
          aria-label={es ? 'Mes siguiente' : 'Next month'}
          className="grid h-9 w-9 place-items-center rounded-full text-brand transition hover:bg-surface-mint disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        className={`grid grid-cols-7 gap-1 text-center transition-opacity ${loading ? 'opacity-60' : ''}`}
        role="group"
        aria-label={es ? `Fechas y precios para ${people} ${people === 1 ? 'persona' : 'personas'}` : `Dates and prices for ${people} ${people === 1 ? 'person' : 'people'}`}
      >
        {WEEKDAYS[lang].map((day, index) => (
          <span key={`${day}-${index}`} className="py-1 text-[11px] font-bold text-muted" aria-hidden="true">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />
          const iso = toIsoDate(date)
          const info = infoFor(iso, date)
          const enabled = info.status === 'available'
          const isSelected = iso === value
          const isLowest = enabled && lowest !== null && info.totalCents === lowest
          const dayName = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })

          // Texto bajo el número. Nunca solo color: cada estado tiene palabra.
          let note: string | null = null
          let spoken: string
          if (enabled && info.totalCents !== null) {
            note = formatWholeDollars(info.totalCents)
            spoken = `${dayName}, ${es ? 'total' : 'total'} ${formatWholeDollars(info.totalCents)}${isLowest ? (es ? ', precio más bajo' : ', lowest price') : ''}`
          } else if (info.status === 'limited') {
            note = es ? `Solo ${info.remaining}` : `Only ${info.remaining}`
            spoken = es
              ? `${dayName}, solo ${info.remaining} ${info.remaining === 1 ? 'lugar' : 'lugares'}`
              : `${dayName}, only ${info.remaining} ${info.remaining === 1 ? 'spot' : 'spots'} left`
          } else if (info.status === 'soldOut') {
            // Tachado y sin texto: «Agotado» no cabe en una celda de 30 px.
            // La leyenda explica el tachado y el lector de pantalla lo dice.
            spoken = `${dayName}, ${es ? 'agotado' : 'sold out'}`
          } else if (info.status === 'closed') {
            spoken = `${dayName}, ${es ? 'cerrado' : 'closed'}`
          } else {
            spoken = `${dayName}, ${es ? 'sin salida' : 'no departure'}`
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => onChange(iso)}
              aria-pressed={isSelected}
              aria-label={spoken}
              // min-w-0 + overflow-hidden: en 320 px cada celda mide ~30 px y
              // un texto largo no debe empujar la columna del domingo fuera.
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl px-0.5 py-1 leading-none transition ${
                isSelected
                  ? 'bg-brand text-white'
                  : enabled
                    ? 'bg-surface-mint text-brand hover:bg-line'
                    : 'text-faint'
              }`}
            >
              <span className={`text-sm ${enabled ? 'font-semibold' : ''} ${info.status === 'soldOut' || info.status === 'closed' ? 'text-accent-deep line-through' : ''}`}>
                {date.getDate()}
              </span>
              {note && (
                <span
                  className={`mt-1 flex max-w-full flex-wrap items-center justify-center gap-0.5 text-center text-[10px] font-bold leading-tight tracking-tight ${
                    isSelected ? 'text-white' : enabled ? (isLowest ? 'text-success-dark' : 'text-brand') : 'text-accent-deep'
                  }`}
                >
                  {isLowest && <TrendingDown size={10} aria-hidden="true" />}
                  {note}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-surface-mint" aria-hidden="true" />
          {es ? 'Días con salida' : 'Departure days'}
        </span>
        {days && [...days.values()].some((day) => day.status === 'soldOut' || day.status === 'closed') && (
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-accent-deep line-through" aria-hidden="true">12</span>
            {es ? 'Agotado o cerrado' : 'Sold out or closed'}
          </span>
        )}
        {lowest !== null && (
          <span className="flex items-center gap-1 font-semibold text-success-dark">
            <TrendingDown size={12} aria-hidden="true" />
            {es ? 'Precio más bajo' : 'Lowest price'}
          </span>
        )}
      </div>
    </div>
  )
}
