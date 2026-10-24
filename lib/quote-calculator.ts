import type { Locale } from './data'
import { PER_KM_USD, WAITING_PER_HOUR_USD } from './services'

/**
 * Cotizador automático del Driver by Tour.
 *
 * Lo que pide el documento de acuerdos: permitir más de dos puntos en una
 * misma cotización, calcular a partir de la distancia y del tiempo de
 * espera, y enseñar un total ANTES de que el visitante escriba.
 *
 * CÓMO SE MIDE LA DISTANCIA. No hay API de mapas: haría falta una clave,
 * una cuenta de facturación y vigilar el consumo, y el sitio no tiene
 * ninguna de las tres. En su lugar, cada punto lleva sus coordenadas y la
 * distancia sale de la fórmula del semiverseno —la distancia en línea
 * recta sobre la esfera— multiplicada por ROAD_FACTOR, porque por
 * carretera siempre se recorre más que en línea recta.
 *
 * Eso da una ESTIMACIÓN, no un kilometraje exacto, y la interfaz lo dice
 * con todas las letras: el total final lo confirma el equipo al responder.
 * El día que haya clave de Google o Mapbox, lo único que cambia es
 * `distanceKm`: todo lo demás ya trabaja con kilómetros.
 *
 * Las funciones son puras y no tocan el DOM: se pueden probar sin
 * navegador (ver tests/quote-calculator.test.ts).
 */

/**
 * Cuánto más se recorre por carretera que en línea recta. 1.3 es lo
 * habitual en terreno montañoso, que es casi todo el país.
 */
export const ROAD_FACTOR = 1.3

/** Puntos que el visitante puede elegir en el cotizador. */
export type Place = {
  id: string
  /** Nombre canónico; no se traduce, igual que los destinos del catálogo. */
  name: string
  region: Record<Locale, string>
  lat: number
  lon: number
}

/**
 * Lista de puntos. Son los destinos del catálogo más los sitios desde los
 * que arranca un traslado de verdad: el aeropuerto y la zona hotelera.
 *
 * Las coordenadas son del centro de cada lugar, con una precisión de uno o
 * dos kilómetros: suficiente para una estimación sobre recorridos de
 * decenas de kilómetros, y coherente con que el resultado se redondee.
 *
 * Al añadir un punto nuevo, basta con sus coordenadas: no hay tabla de
 * distancias que rellenar ni combinaciones que mantener.
 */
export const places: Place[] = [
  { id: 'san-salvador', name: 'San Salvador', region: { ES: 'San Salvador', EN: 'San Salvador' }, lat: 13.6929, lon: -89.2182 },
  { id: 'aeropuerto', name: 'Aeropuerto de El Salvador', region: { ES: 'San Luis Talpa, La Paz', EN: 'San Luis Talpa, La Paz' }, lat: 13.4409, lon: -89.0557 },
  { id: 'santa-tecla', name: 'Santa Tecla', region: { ES: 'La Libertad', EN: 'La Libertad' }, lat: 13.6769, lon: -89.2797 },
  { id: 'la-libertad', name: 'La Libertad', region: { ES: 'La Libertad', EN: 'La Libertad' }, lat: 13.4883, lon: -89.3222 },
  { id: 'el-tunco', name: 'El Tunco', region: { ES: 'La Libertad', EN: 'La Libertad' }, lat: 13.4933, lon: -89.3822 },
  { id: 'el-zonte', name: 'El Zonte', region: { ES: 'La Libertad', EN: 'La Libertad' }, lat: 13.4939, lon: -89.4414 },
  { id: 'tamanique', name: 'Tamanique', region: { ES: 'La Libertad', EN: 'La Libertad' }, lat: 13.5944, lon: -89.3769 },
  { id: 'puerta-del-diablo', name: 'Puerta del Diablo', region: { ES: 'Panchimalco, San Salvador', EN: 'Panchimalco, San Salvador' }, lat: 13.6217, lon: -89.1731 },
  { id: 'suchitoto', name: 'Suchitoto', region: { ES: 'Cuscatlán', EN: 'Cuscatlán' }, lat: 13.9375, lon: -89.0281 },
  { id: 'santa-ana', name: 'Santa Ana', region: { ES: 'Santa Ana', EN: 'Santa Ana' }, lat: 13.9942, lon: -89.5597 },
  { id: 'volcan-de-santa-ana', name: 'Volcán de Santa Ana', region: { ES: 'Santa Ana', EN: 'Santa Ana' }, lat: 13.8533, lon: -89.6303 },
  { id: 'lago-de-coatepeque', name: 'Lago de Coatepeque', region: { ES: 'Santa Ana', EN: 'Santa Ana' }, lat: 13.8667, lon: -89.5500 },
  { id: 'juayua', name: 'Juayúa', region: { ES: 'Ruta de las Flores, Sonsonate', EN: 'Ruta de las Flores, Sonsonate' }, lat: 13.8411, lon: -89.7456 },
  { id: 'ataco', name: 'Concepción de Ataco', region: { ES: 'Ruta de las Flores, Ahuachapán', EN: 'Ruta de las Flores, Ahuachapán' }, lat: 13.8714, lon: -89.8494 },
  { id: 'los-almendros', name: 'Los Almendros', region: { ES: 'Sonsonate', EN: 'Sonsonate' }, lat: 13.6833, lon: -89.7667 },
  { id: 'san-miguel', name: 'San Miguel', region: { ES: 'San Miguel', EN: 'San Miguel' }, lat: 13.4833, lon: -88.1833 },
  { id: 'volcan-de-conchagua', name: 'Volcán de Conchagua', region: { ES: 'La Unión', EN: 'La Unión' }, lat: 13.2764, lon: -87.8569 },
]

export function getPlace(id: string): Place | undefined {
  return places.find((place) => place.id === id)
}

/* ------------------------------------------------------------------ */
/* Distancia                                                           */
/* ------------------------------------------------------------------ */

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Kilómetros por carretera (estimados) entre dos puntos.
 *
 * Semiverseno sobre la esfera y, encima, el factor de carretera. Es el
 * único sitio que habría que cambiar para pasar a una API de mapas.
 */
export function distanceKm(from: Place, to: Place): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLon = toRadians(to.lon - from.lon)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLon / 2) ** 2
  const straight = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
  return straight * ROAD_FACTOR
}

/* ------------------------------------------------------------------ */
/* Cotización                                                          */
/* ------------------------------------------------------------------ */

/**
 * Los dos tipos de ruta, que es lo que decide si se cobra espera.
 *
 *   transfer  Traslado: te llevamos de un sitio a otro, aunque sea
 *             recogiendo en varios puntos. SIN cargo por espera: así se
 *             acordó. Solo el viaje.
 *   tour      Recorrido con paradas: el conductor te espera en cada una,
 *             y esas horas sí se cobran.
 */
export type TripType = 'transfer' | 'tour'

export type RoutePlan = {
  type: TripType
  /** Puntos en orden, del primero al último. Mínimo dos. */
  stops: Place[]
  /** Volver al punto de partida al terminar (solo tiene sentido en un tour). */
  roundTrip: boolean
  /** Horas que el conductor espera, en total. Se ignora en un traslado. */
  waitingHours: number
}

export type Quote = {
  /** Kilómetros estimados del recorrido completo, ya redondeados. */
  km: number
  tripUsd: number
  waitingUsd: number
  totalUsd: number
  /** false en los traslados: ahí la espera no se cobra. */
  waitingCharged: boolean
}

/** Redondeo del kilometraje. Es una estimación: fingir precisión engaña. */
function roundKm(km: number): number {
  return Math.max(5, Math.round(km / 5) * 5)
}

/**
 * Calcula la cotización, o null si la ruta todavía no tiene dos puntos
 * distintos (el visitante está a medias de rellenarla).
 */
export function quoteRoute(plan: RoutePlan): Quote | null {
  const stops = plan.roundTrip && plan.stops.length > 1 ? [...plan.stops, plan.stops[0]] : plan.stops
  if (stops.length < 2) return null

  let raw = 0
  for (let i = 1; i < stops.length; i++) {
    raw += distanceKm(stops[i - 1], stops[i])
  }
  if (raw === 0) return null

  const km = roundKm(raw)
  const waitingCharged = plan.type === 'tour'
  const hours = waitingCharged ? Math.max(0, plan.waitingHours) : 0

  const tripUsd = km * PER_KM_USD
  const waitingUsd = hours * WAITING_PER_HOUR_USD

  return {
    km,
    tripUsd: Math.round(tripUsd),
    waitingUsd: Math.round(waitingUsd),
    totalUsd: Math.round(tripUsd + waitingUsd),
    waitingCharged,
  }
}

/* ------------------------------------------------------------------ */
/* Texto para WhatsApp y correo                                        */
/* ------------------------------------------------------------------ */

/**
 * La cotización en texto plano, para que el visitante la mande tal cual y
 * el equipo reciba la ruta completa en lugar de un «hola, ¿cuánto vale?».
 */
export function quoteSummary(plan: RoutePlan, quote: Quote, lang: Locale): string {
  const es = lang === 'ES'
  const route = plan.stops.map((stop) => stop.name).join(' → ')
  const lines = [
    es ? `Ruta: ${route}` : `Route: ${route}`,
    plan.roundTrip
      ? es
        ? 'Ida y vuelta al punto de partida'
        : 'Round trip to the starting point'
      : es
        ? 'Solo ida'
        : 'One way',
    es ? `Distancia estimada: ${quote.km} km` : `Estimated distance: ${quote.km} km`,
  ]

  if (quote.waitingCharged && plan.waitingHours > 0) {
    lines.push(
      es
        ? `Espera: ${plan.waitingHours} ${plan.waitingHours === 1 ? 'hora' : 'horas'}`
        : `Waiting: ${plan.waitingHours} ${plan.waitingHours === 1 ? 'hour' : 'hours'}`,
    )
  }

  lines.push(
    es ? `Total estimado: $${quote.totalUsd}` : `Estimated total: $${quote.totalUsd}`,
  )

  return lines.join('\n')
}
