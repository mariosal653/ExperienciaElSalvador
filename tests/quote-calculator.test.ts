import { describe, it, expect } from 'vitest'
import { PER_KM_USD, WAITING_PER_HOUR_USD } from '../lib/services'
import {
  distanceKm,
  getPlace,
  places,
  quoteRoute,
  quoteSummary,
  type RoutePlan,
} from '../lib/quote-calculator'

/**
 * Cotizador del Driver by Tour. Sin navegador ni base de datos.
 *
 * Lo que se protege: que la regla de la espera se respete —en un traslado
 * no se cobra, aunque el formulario traiga horas—, que una ruta de más de
 * dos puntos sume todos los tramos, y que las distancias estimadas no se
 * vayan de lo razonable si alguien toca el factor de carretera o mueve
 * unas coordenadas.
 */

const place = (id: string) => {
  const found = getPlace(id)
  if (!found) throw new Error(`Falta el punto ${id} en lib/quote-calculator.ts`)
  return found
}

const plan = (overrides: Partial<RoutePlan> = {}): RoutePlan => ({
  type: 'transfer',
  stops: [place('san-salvador'), place('el-tunco')],
  roundTrip: false,
  waitingHours: 0,
  ...overrides,
})

describe('distancias estimadas', () => {
  // Kilometraje real aproximado por carretera. El cotizador avisa de que
  // es una estimación, así que basta con que no se desvíe de forma
  // escandalosa: un 35 % en rutas cortas y un 25 % en las largas.
  const known: [string, string, number][] = [
    ['san-salvador', 'santa-ana', 65],
    ['san-salvador', 'aeropuerto', 45],
    ['san-salvador', 'suchitoto', 47],
    ['san-salvador', 'el-tunco', 42],
    ['san-salvador', 'san-miguel', 135],
  ]

  it.each(known)('%s → %s se parece al recorrido real', (from, to, real) => {
    const estimated = distanceKm(place(from), place(to))
    const margin = real < 50 ? 0.35 : 0.25
    expect(estimated).toBeGreaterThan(real * (1 - margin))
    expect(estimated).toBeLessThan(real * (1 + margin))
  })

  it('todos los puntos tienen coordenadas dentro de El Salvador', () => {
    for (const item of places) {
      expect(item.lat).toBeGreaterThan(13.1)
      expect(item.lat).toBeLessThan(14.5)
      expect(item.lon).toBeGreaterThan(-90.2)
      expect(item.lon).toBeLessThan(-87.6)
    }
  })

  it('no hay puntos repetidos', () => {
    expect(new Set(places.map((item) => item.id)).size).toBe(places.length)
  })
})

describe('cotización', () => {
  it('sin dos puntos todavía no hay nada que cotizar', () => {
    expect(quoteRoute(plan({ stops: [place('san-salvador')] }))).toBeNull()
  })

  it('el viaje se cobra a la tarifa por kilómetro acordada', () => {
    const quote = quoteRoute(plan())
    expect(quote).not.toBeNull()
    expect(quote!.tripUsd).toBe(Math.round(quote!.km * PER_KM_USD))
    expect(quote!.totalUsd).toBe(quote!.tripUsd)
  })

  it('una ruta de tres puntos cuesta más que la misma de dos', () => {
    const directo = quoteRoute(plan({ stops: [place('san-salvador'), place('santa-ana')] }))!
    const conParada = quoteRoute(
      plan({ stops: [place('san-salvador'), place('suchitoto'), place('santa-ana')] }),
    )!
    expect(conParada.km).toBeGreaterThan(directo.km)
    expect(conParada.totalUsd).toBeGreaterThan(directo.totalUsd)
  })

  it('ida y vuelta recorre aproximadamente el doble', () => {
    const ida = quoteRoute(plan({ type: 'tour', stops: [place('san-salvador'), place('santa-ana')] }))!
    const vuelta = quoteRoute(
      plan({ type: 'tour', stops: [place('san-salvador'), place('santa-ana')], roundTrip: true }),
    )!
    expect(vuelta.km).toBeGreaterThan(ida.km * 1.9)
    expect(vuelta.km).toBeLessThan(ida.km * 2.1)
  })

  it('en un recorrido con paradas la espera se suma a la tarifa acordada', () => {
    const quote = quoteRoute(plan({ type: 'tour', waitingHours: 3 }))!
    expect(quote.waitingCharged).toBe(true)
    expect(quote.waitingUsd).toBe(3 * WAITING_PER_HOUR_USD)
    expect(quote.totalUsd).toBe(quote.tripUsd + quote.waitingUsd)
  })

  it('en un traslado NO se cobra espera, aunque vengan horas', () => {
    const quote = quoteRoute(plan({ type: 'transfer', waitingHours: 4 }))!
    expect(quote.waitingCharged).toBe(false)
    expect(quote.waitingUsd).toBe(0)
    expect(quote.totalUsd).toBe(quote.tripUsd)
  })

  it('el traslado de varios puntos a uno solo tampoco cobra espera', () => {
    const quote = quoteRoute(
      plan({
        type: 'transfer',
        stops: [place('el-tunco'), place('el-zonte'), place('aeropuerto')],
        waitingHours: 2,
      }),
    )!
    expect(quote.waitingUsd).toBe(0)
    expect(quote.totalUsd).toBe(quote.tripUsd)
  })
})

describe('resumen para enviar', () => {
  it('lleva la ruta completa, la distancia y el total', () => {
    const route = plan({ type: 'tour', waitingHours: 2, stops: [place('san-salvador'), place('suchitoto'), place('santa-ana')] })
    const quote = quoteRoute(route)!
    const text = quoteSummary(route, quote, 'ES')
    expect(text).toContain('San Salvador → Suchitoto → Santa Ana')
    expect(text).toContain(`${quote.km} km`)
    expect(text).toContain('2 horas')
    expect(text).toContain(`$${quote.totalUsd}`)
  })

  it('el traslado no menciona la espera', () => {
    const route = plan({ type: 'transfer', waitingHours: 3 })
    const text = quoteSummary(route, quoteRoute(route)!, 'ES')
    expect(text).not.toMatch(/espera/i)
  })
})
