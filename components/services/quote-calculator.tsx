'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Clock, Info, MapPin, Minus, Plus, Route, Trash2 } from 'lucide-react'
import { QuoteActions } from '@/components/services/quote-actions'
import { useLanguage } from '@/components/i18n/language-provider'
import { PER_KM_USD, WAITING_PER_HOUR_USD } from '@/lib/services'
import {
  getPlace,
  places,
  quoteRoute,
  quoteSummary,
  type RoutePlan,
  type TripType,
} from '@/lib/quote-calculator'

/** Tope de paradas. Más que esto ya es un itinerario que conviene hablar. */
const MAX_STOPS = 6
const MAX_WAITING_HOURS = 12

/**
 * Cotizador automático del Driver by Tour (punto 2 del documento de
 * acuerdos): más de dos puntos, distancia, tiempo de espera y un total a
 * la vista ANTES de escribir.
 *
 * El cálculo no vive aquí: está en lib/quote-calculator.ts, que son
 * funciones puras con sus pruebas. Este componente solo recoge la ruta y
 * enseña el resultado.
 *
 * El total es una ESTIMACIÓN y se dice en voz alta, debajo de la cifra: la
 * distancia sale de las coordenadas de cada punto, no de un callejero, y
 * quien confirma el precio es el equipo al responder. Prometer un precio
 * cerrado que luego cambia cuesta más que no darlo.
 */
export function QuoteCalculator({ service }: { service: string }) {
  const { lang } = useLanguage()
  const es = lang === 'ES'

  const [type, setType] = useState<TripType>('transfer')
  const [stopIds, setStopIds] = useState<string[]>(['san-salvador', 'el-tunco'])
  const [roundTrip, setRoundTrip] = useState(false)
  const [waitingHours, setWaitingHours] = useState(2)

  const plan: RoutePlan = useMemo(
    () => ({
      type,
      stops: stopIds.map((id) => getPlace(id)).filter((place) => place !== undefined),
      roundTrip: type === 'tour' && roundTrip,
      waitingHours,
    }),
    [type, stopIds, roundTrip, waitingHours],
  )

  const quote = useMemo(() => quoteRoute(plan), [plan])

  const setStop = (index: number, id: string) =>
    setStopIds((current) => current.map((value, position) => (position === index ? id : value)))

  const addStop = () =>
    setStopIds((current) => {
      if (current.length >= MAX_STOPS) return current
      // Se añade un punto que no esté ya al final, para que la parada nueva
      // sume algo y el total cambie al instante.
      const next = places.find((place) => place.id !== current[current.length - 1])
      return next ? [...current, next.id] : current
    })

  const removeStop = (index: number) =>
    setStopIds((current) => (current.length <= 2 ? current : current.filter((_, position) => position !== index)))

  const field =
    'w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm font-semibold text-brand transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

  const tab = (active: boolean) =>
    `flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
      active ? 'bg-brand text-white' : 'bg-surface text-brand hover:bg-surface-mint'
    }`

  const stepper =
    'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-brand transition hover:bg-surface-mint disabled:cursor-default disabled:opacity-35 disabled:hover:bg-surface'

  return (
    <section aria-labelledby="cotizador-title" className="rounded-3xl border border-line bg-surface p-6 lg:p-7">
      <h2 id="cotizador-title" className="flex items-center gap-2 text-xl font-semibold">
        <Route size={19} className="text-accent" aria-hidden="true" />
        {es ? 'Calcula tu cotización' : 'Work out your quote'}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {es
          ? 'Arma la ruta y mira el total al momento. Puedes añadir todas las paradas que necesites.'
          : 'Build the route and see the total right away. Add as many stops as you need.'}
      </p>

      {/* Qué tipo de ruta es: de esto depende que se cobre espera o no. */}
      <fieldset className="mt-6">
        <legend className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-muted">
          {es ? 'Tipo de ruta' : 'Type of route'}
        </legend>
        <div className="flex gap-2 rounded-2xl bg-surface-mint p-1">
          <button type="button" onClick={() => setType('transfer')} aria-pressed={type === 'transfer'} className={tab(type === 'transfer')}>
            {es ? 'Traslado' : 'Transfer'}
          </button>
          <button type="button" onClick={() => setType('tour')} aria-pressed={type === 'tour'} className={tab(type === 'tour')}>
            {es ? 'Recorrido con paradas' : 'Route with stops'}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {type === 'transfer'
            ? es
              ? 'Te llevamos de un sitio a otro, aunque recojamos en varios puntos. No se cobra espera.'
              : 'We take you from one place to another, even with several pickup points. No waiting charge.'
            : es
              ? `El conductor te espera en cada parada: esas horas se cobran a $${WAITING_PER_HOUR_USD}.`
              : `The driver waits for you at each stop: those hours cost $${WAITING_PER_HOUR_USD} each.`}
        </p>
      </fieldset>

      {/* La ruta. Más de dos puntos es un requisito del acuerdo. */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-muted">
          {es ? 'La ruta' : 'The route'}
        </p>
        <ol className="space-y-2">
          {stopIds.map((id, index) => (
            <li key={`${id}-${index}`} className="flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-mint text-brand">
                <MapPin size={15} aria-hidden="true" />
              </span>
              <label className="sr-only" htmlFor={`parada-${index}`}>
                {index === 0
                  ? es ? 'Punto de partida' : 'Starting point'
                  : es ? `Parada ${index}` : `Stop ${index}`}
              </label>
              <select id={`parada-${index}`} value={id} onChange={(event) => setStop(index, event.target.value)} className={field}>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name} · {place.region[lang]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeStop(index)}
                disabled={stopIds.length <= 2}
                className={stepper}
                aria-label={es ? `Quitar la parada ${index + 1}` : `Remove stop ${index + 1}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>

        {stopIds.length < MAX_STOPS && (
          <button
            type="button"
            onClick={addStop}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm font-bold text-brand transition hover:bg-surface-mint"
          >
            <Plus size={15} aria-hidden="true" />
            {es ? 'Añadir parada' : 'Add a stop'}
          </button>
        )}
      </div>

      {/* Solo en un recorrido: vuelta al inicio y horas de espera. */}
      {type === 'tour' && (
        <div className="mt-6 space-y-4 rounded-2xl bg-surface-soft p-4">
          <label className="flex items-center gap-2.5 text-sm font-semibold">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={(event) => setRoundTrip(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {es ? 'Volver al punto de partida' : 'Return to the starting point'}
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Clock size={15} className="text-faint" aria-hidden="true" />
              {es ? 'Horas de espera' : 'Hours of waiting'}
            </span>
            <span className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWaitingHours((hours) => Math.max(0, hours - 1))}
                disabled={waitingHours <= 0}
                className={stepper}
                aria-label={es ? 'Una hora menos' : 'One hour less'}
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <output className="w-8 text-center text-lg font-bold" aria-live="polite">{waitingHours}</output>
              <button
                type="button"
                onClick={() => setWaitingHours((hours) => Math.min(MAX_WAITING_HOURS, hours + 1))}
                disabled={waitingHours >= MAX_WAITING_HOURS}
                className={stepper}
                aria-label={es ? 'Una hora más' : 'One hour more'}
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      )}

      {/* El total, que es lo que el visitante ha venido a ver. */}
      {quote && (
        <div className="mt-6 rounded-2xl bg-surface-mint p-5">
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{es ? 'Distancia estimada' : 'Estimated distance'}</dt>
              <dd className="font-semibold">{quote.km} km</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">
                {es ? `Recorrido · $${PER_KM_USD} por km` : `Route · $${PER_KM_USD} per km`}
              </dt>
              <dd className="font-semibold">${quote.tripUsd}</dd>
            </div>
            {quote.waitingCharged && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">
                  {es
                    ? `Espera · ${waitingHours} h a $${WAITING_PER_HOUR_USD}`
                    : `Waiting · ${waitingHours} h at $${WAITING_PER_HOUR_USD}`}
                </dt>
                <dd className="font-semibold">${quote.waitingUsd}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt className="font-bold">{es ? 'Total estimado' : 'Estimated total'}</dt>
              <dd className="text-3xl font-extrabold leading-none text-brand">${quote.totalUsd}</dd>
            </div>
          </dl>

          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {es
              ? 'Es una estimación: la distancia se calcula entre los puntos elegidos y el total lo confirmamos al responderte. La gasolina va incluida en el precio por kilómetro.'
              : 'This is an estimate: the distance is measured between the places you picked and we confirm the total when we reply. Fuel is included in the per-kilometre price.'}
          </p>

          <div className="mt-5">
            <QuoteActions
              service={service}
              lang={lang}
              source="cotizador"
              size="lg"
              details={quoteSummary(plan, quote, lang)}
            />
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <ArrowRight size={13} aria-hidden="true" />
            {es
              ? 'Te llega la ruta completa, no hace falta que la escribas otra vez.'
              : 'The full route goes with it, so you do not have to type it again.'}
          </p>
        </div>
      )}
    </section>
  )
}
