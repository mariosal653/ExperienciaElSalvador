'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, MapPin, Minus, Plus, Ticket } from 'lucide-react'
import { toIsoDate, parseLocalDate } from '@/lib/data'
import { calculatePrice } from '@/lib/pricing'

type ExperienceView = {
  id: string
  title: string
  destination: string
  image: string
  priceUsd: number
  durationHours: number
  maxPeople: number
  weekdays: number[]
}

function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

/** Próximas fechas en que sale la experiencia. */
function upcomingDates(weekdays: number[], count = 8): string[] {
  const out: string[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < 120 && out.length < count; i++) {
    if (weekdays.includes(cursor.getDay())) out.push(toIsoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

export function BookingForm({
  experience,
  discountPct,
}: {
  experience: ExperienceView
  discountPct: number
}) {
  const router = useRouter()
  const dates = useMemo(() => upcomingDates(experience.weekdays), [experience.weekdays])

  const [date, setDate] = useState(dates[0] ?? '')
  const [people, setPeople] = useState(2)
  const [useDiscount, setUseDiscount] = useState(discountPct > 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ code: string; total: number } | null>(null)

  const unitCents = Math.round(experience.priceUsd * 100)
  // Vista previa. El importe que vale es el que calcula el servidor.
  const preview = calculatePrice(unitCents, people, useDiscount ? discountPct : 0)

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: experience.id,
          date,
          people,
          applyWelcomeDiscount: useDiscount,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(
          payload.error === 'benefitAlreadyUsed'
            ? 'Ese descuento ya fue utilizado.'
            : payload.error === 'notAvailable'
              ? 'La experiencia no sale ese día.'
              : payload.error === 'dateInPast'
                ? 'Elige una fecha futura.'
                : 'No se pudo completar la reserva. Intenta de nuevo.',
        )
        setLoading(false)
        return
      }

      setDone({ code: payload.booking.code, total: payload.booking.totalCents })
      router.refresh()
    } catch {
      setError('No se pudo completar la reserva. Intenta de nuevo.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#a4cdbc] bg-[#e3f0e9] p-8 text-center md:p-12">
        <CheckCircle2 size={44} className="mx-auto text-[#256b54]" />
        <h1 className="mt-4 text-2xl font-semibold text-[#173f45]">Reserva confirmada</h1>
        <p className="mt-2 text-sm text-[#3f6a5c]">
          Tu código es <strong className="font-mono">{done.code}</strong>. Total pagado {money(done.total)}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/cuenta/experiencias"
            className="rounded-full bg-[#173f45] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0e3035]"
          >
            Ver mis experiencias
          </a>
          <a
            href="/#experiencias"
            className="rounded-full border border-[#a4cdbc] bg-white px-5 py-3 text-sm font-bold text-[#173f45] transition hover:bg-[#f4f7f5]"
          >
            Seguir explorando
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#173f45] md:text-3xl">
          {experience.title}
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#6a8588]">
          <MapPin size={14} />
          {experience.destination} · {experience.durationHours} horas
        </p>

        <img
          src={experience.image}
          alt=""
          className="mt-5 h-52 w-full rounded-2xl object-cover md:h-64"
        />

        <fieldset className="mt-7">
          <legend className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#759096]">
            Elige la fecha
          </legend>
          <div className="flex flex-wrap gap-2">
            {dates.map((option) => {
              const parsed = parseLocalDate(option)
              const label = parsed
                ? parsed.toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })
                : option
              const selected = option === date
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDate(option)}
                  aria-pressed={selected}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    selected
                      ? 'bg-[#173f45] text-white'
                      : 'border border-[#dce7e1] bg-white text-[#173f45] hover:bg-[#eaf1ed]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-7">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#759096]">
            Viajeros
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPeople((value) => Math.max(1, value - 1))}
              disabled={people <= 1}
              aria-label="Quitar un viajero"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#dce7e1] bg-white text-[#173f45] transition hover:border-[#173f45] disabled:opacity-35"
            >
              <Minus size={16} />
            </button>
            <span aria-live="polite" className="min-w-[6rem] text-center text-base font-semibold text-[#173f45]">
              {people} {people === 1 ? 'persona' : 'personas'}
            </span>
            <button
              type="button"
              onClick={() => setPeople((value) => Math.min(experience.maxPeople, value + 1))}
              disabled={people >= experience.maxPeople}
              aria-label="Agregar un viajero"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#dce7e1] bg-white text-[#173f45] transition hover:border-[#173f45] disabled:opacity-35"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <aside className="h-fit rounded-2xl border border-[#dce7e1] bg-white p-6 lg:sticky lg:top-6">
        <h2 className="text-sm font-bold uppercase tracking-[.14em] text-[#759096]">Resumen</h2>

        <dl className="mt-4 flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#6a8588]">
              {money(unitCents)} × {people}
            </dt>
            <dd className="font-semibold text-[#173f45]">{money(preview.subtotalCents)}</dd>
          </div>

          {preview.discountCents > 0 && (
            <div className="flex justify-between text-[#256b54]">
              <dt>Descuento {preview.discountPct}%</dt>
              <dd className="font-semibold">−{money(preview.discountCents)}</dd>
            </div>
          )}

          <div className="mt-1 flex justify-between border-t border-[#edf0ed] pt-3">
            <dt className="font-semibold text-[#173f45]">Total</dt>
            <dd className="text-xl font-semibold text-[#173f45]">{money(preview.totalCents)}</dd>
          </div>
        </dl>

        {discountPct > 0 && (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f4d27c]/35 p-3.5">
            <input
              type="checkbox"
              checked={useDiscount}
              onChange={(event) => setUseDiscount(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#b8481c]"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-bold text-[#173f45]">
                <Ticket size={14} /> Usar mi {discountPct}% de bienvenida
              </span>
              <span className="mt-0.5 block text-xs text-[#6a8588]">
                Solo se consume si la reserva se completa.
              </span>
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-[#fae6e0] px-4 py-3 text-sm font-medium text-[#a3341c]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading || !date}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#b8481c] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#963b18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173f45] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Confirmar reserva
        </button>

        <p className="mt-3 text-center text-xs text-[#6a8588]">
          El precio final lo calcula el servidor.
        </p>
      </aside>
    </div>
  )
}
