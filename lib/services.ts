import type { Locale } from './data'

/**
 * Servicio de transporte con conductor: Personal Driver.
 *
 * Es la oferta que el sitio debe vender primero (acuerdo 01: «dar mayor
 * visibilidad» al transporte), así que vive en su propio archivo y no
 * mezclado con el catálogo de experiencias: una experiencia se reserva y se
 * paga; el servicio de conductor se cotiza.
 *
 * SOLO EXISTE UNO. Hasta noviembre de 2026 había también «Driver by Tour»
 * (conductor para una ruta, cobrado por kilómetro más espera); el cliente lo
 * retiró y su página redirige a Personal Driver (next.config.mjs).
 *
 * Condiciones confirmadas con el cliente (documento «Tours y precios»,
 * noviembre de 2026): US$30 por hora, SIN mínimo de horas, gasolina y
 * tiempo de espera incluidos, hasta 7 personas y guía turístico bilingüe
 * opcional por US$75 por día.
 */

export type ServiceId = 'personal-driver'

type Text = Record<Locale, string>
type List = Record<Locale, string[]>

/* ------------------------------------------------------------------ */
/* Condiciones comerciales                                             */
/* ------------------------------------------------------------------ */

/** Tarifa por hora del Personal Driver, en dólares. Gasolina y espera incluidas. */
export const HOURLY_USD = 30

/** Guía turístico bilingüe como complemento, por DÍA de servicio. */
export const GUIDE_PER_DAY_USD = 75

/** Capacidad comercial del vehículo: una sola cifra en todo el sitio. */
export const VEHICLE_SEATS = 7

/**
 * Cifra en dólares para mostrar: entera sin decimales ($30) y con centavos
 * siempre a dos cifras ($1.50, nunca $1.5).
 */
export function formatUsd(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

/* ------------------------------------------------------------------ */
/* Vehículo                                                            */
/* ------------------------------------------------------------------ */

/**
 * El vehículo del servicio. Se muestra en la portada y en el detalle: el
 * viajero que cotiza un traslado quiere saber en qué va a viajar antes de
 * escribir.
 *
 * La foto la aportó el cliente. Es un PNG recortado (fondo transparente)
 * para que el vehículo se apoye sobre el color de la tarjeta y no sobre un
 * blanco recortado; la placa lleva el nombre de la marca en lugar del
 * «N400» de catálogo. `illustration` queda para cuando una foto sea un
 * dibujo o un modelo de referencia y haya que avisarlo bajo la imagen.
 */
export const vehicle = {
  model: 'Chevrolet N400',
  kind: { ES: 'Microbús', EN: 'Minibus' } satisfies Text,
  seats: VEHICLE_SEATS,
  illustration: false,
  image: {
    src: '/img/servicios/microbus-n400.png',
    alt: {
      ES: 'Microbús Chevrolet N400 para siete pasajeros',
      EN: 'Chevrolet N400 minibus for seven passengers',
    } satisfies Text,
  },
  features: {
    ES: ['Aire acondicionado', `Hasta ${VEHICLE_SEATS} pasajeros`, 'Espacio para equipaje', 'Conductor local'],
    EN: ['Air conditioning', `Up to ${VEHICLE_SEATS} passengers`, 'Room for luggage', 'Local driver'],
  } satisfies List,
} as const

/* ------------------------------------------------------------------ */
/* Servicio                                                            */
/* ------------------------------------------------------------------ */

export type Service = {
  id: ServiceId
  /** Nombre comercial. NO se traduce: es el nombre de la oferta. */
  name: string
  /** Frase corta bajo el nombre. */
  tagline: Text
  /** Una línea de presentación en la portada. */
  summary: Text
  /** Texto de la página de detalle y de la meta description. */
  description: Text
  /**
   * Precio de arranque. `null` significa que el servicio se cotiza y no se
   * publica ninguna cifra: no inventar un «desde» para rellenar el hueco.
   */
  priceFromUsd: number | null
  /** Unidad del precio, o la etiqueta de cotización cuando no hay cifra. */
  priceUnit: Text
  /** La misma unidad en el catálogo UN/CEFACT, para los datos estructurados: HUR (hora). */
  priceUnitCode: 'HUR'
  /** Condición que acompaña al precio. */
  priceNote: Text | null
  /** Clave del icono, resuelta en el componente. */
  icon: 'car'
  highlights: List
  includes: List
  excludes: List
  /** Lo que conviene saber antes de escribir. */
  notes: List
}

export const personalDriver: Service = {
  id: 'personal-driver',
  name: 'Personal Driver',
  tagline: {
    ES: 'Tu propio itinerario, por horas',
    EN: 'Your own itinerary, by the hour',
  },
  summary: {
    ES: 'Vehículo con conductor a tu disposición: decides a dónde vas y cuánto te quedas en cada sitio. Gasolina y espera incluidas.',
    EN: 'A vehicle with driver at your disposal: you decide where to go and how long to stay. Fuel and waiting included.',
  },
  description: {
    ES: 'Contratas el microbús con conductor por horas y organizas tu propio recorrido por El Salvador. Sin itinerario fijo: paras donde quieras, cambias de plan a mitad del día y el conductor te espera. La tarifa ya incluye la gasolina y el tiempo de espera, así que el total es simplemente las horas por $30. Es la opción de quien ya sabe qué quiere ver, viaja en familia o en grupo pequeño, o necesita moverse varios días seguidos.',
    EN: 'You hire the minibus with a driver by the hour and plan your own route around El Salvador. No fixed itinerary: stop wherever you want, change plans halfway through the day and the driver waits for you. The rate already includes fuel and waiting time, so the total is simply the hours times $30. It suits travellers who already know what they want to see, families and small groups, or anyone who needs to move around for several days.',
  },
  priceFromUsd: HOURLY_USD,
  priceUnit: { ES: 'por hora', EN: 'per hour' },
  priceUnitCode: 'HUR',
  priceNote: {
    ES: 'Gasolina y espera incluidas · sin mínimo de horas',
    EN: 'Fuel and waiting included · no minimum hours',
  },
  icon: 'car',
  highlights: {
    ES: ['Gasolina y espera incluidas', 'Las paradas y los horarios los decides tú', `Hasta ${VEHICLE_SEATS} personas`],
    EN: ['Fuel and waiting included', 'You set the stops and the timing', `Up to ${VEHICLE_SEATS} people`],
  },
  includes: {
    ES: [
      `Microbús ${vehicle.model} con aire acondicionado`,
      'Conductor por las horas contratadas',
      'Gasolina',
      'Tiempo de espera en cada parada',
      `Hasta ${VEHICLE_SEATS} pasajeros`,
      'Itinerario libre dentro del horario',
    ],
    EN: [
      `${vehicle.model} minibus with air conditioning`,
      'Driver for the hours booked',
      'Fuel',
      'Waiting time at every stop',
      `Up to ${VEHICLE_SEATS} passengers`,
      'Free itinerary within the agreed hours',
    ],
  },
  excludes: {
    ES: ['Entradas, comidas y bebidas', 'Guía turístico bilingüe (complemento aparte)', 'Propinas'],
    EN: ['Entrance fees, food and drinks', 'Bilingual tour guide (separate add-on)', 'Tips'],
  },
  notes: {
    ES: [
      'Se cobra por hora, sin mínimo: pagas solo el tiempo que uses.',
      'La gasolina y el tiempo que el conductor te espera ya están incluidos en la tarifa.',
      'Para varios días seguidos o rutas de madrugada, escríbenos con antelación: ajustamos el horario y el total.',
    ],
    EN: [
      'Charged by the hour, with no minimum: you only pay for the time you use.',
      'Fuel and the time the driver waits for you are already included in the rate.',
      'For several days in a row or early-morning routes, write to us ahead of time: we adjust the schedule and the total.',
    ],
  },
}

/** Lista de servicios (hoy, uno). Se mantiene como lista para el sitemap y las rutas. */
export const services: Service[] = [personalDriver]

/* ------------------------------------------------------------------ */
/* Complemento                                                         */
/* ------------------------------------------------------------------ */

/**
 * Guía turístico bilingüe. Es un COMPLEMENTO del Personal Driver, no otro
 * servicio: se muestra dentro de su bloque, nunca como tarjeta propia.
 *
 * El conductor es salvadoreño y conoce las rutas; el guía bilingüe es
 * quien explica los lugares en inglés. Son dos cosas distintas y el texto
 * lo deja claro a propósito.
 */
export const guideAddOn = {
  priceUsd: GUIDE_PER_DAY_USD,
  name: { ES: 'Guía turístico bilingüe', EN: 'Bilingual tour guide' } satisfies Text,
  unit: { ES: 'por día', EN: 'per day' } satisfies Text,
  description: {
    ES: 'Súmalo a tu Personal Driver y alguien te cuenta, en inglés o en español, lo que estás viendo.',
    EN: 'Add it to your Personal Driver and someone tells you what you are seeing, in English or Spanish.',
  } satisfies Text,
} as const

/** Busca un servicio por su id (el id es también el slug de su página). */
export function getService(id: string): Service | undefined {
  return services.find((service) => service.id === id)
}
