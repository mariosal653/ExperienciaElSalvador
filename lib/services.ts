import type { Locale } from './data'

/**
 * Servicios de transporte con conductor.
 *
 * Son la oferta que el sitio debe vender primero (acuerdo 01: «dar mayor
 * visibilidad a Driver by Tour / Personal Driver»), así que viven en su
 * propio archivo y no mezclados con el catálogo de experiencias: una
 * experiencia se reserva y se paga; un servicio de conductor se cotiza.
 *
 * SOLO EXISTEN DOS. El documento de acuerdos hablaba también de «Driver
 * privado»; quedó confirmado que era otro nombre para la misma oferta, no
 * un tercer servicio. Añadir tarjetas aquí es desplazar estas dos de la
 * parte principal de la portada, que es precisamente lo que el acuerdo
 * pide evitar.
 *
 * Diferencia entre los dos, para que los textos no se solapen:
 *   Driver by Tour   el conductor cubre una ruta o tour concreto → se
 *                    cotiza por recorrido.
 *   Personal Driver  el vehículo con conductor queda a disposición del
 *                    cliente, que arma su propio itinerario → por hora.
 *
 * Confirmado con el cliente: capacidad de 6 personas, mínimo de 3 horas,
 * guía bilingüe a US$75 por día, US$0.75 por kilómetro y US$5 por hora de
 * espera, esta última con la excepción que se explica en
 * WAITING_PER_HOUR_USD. Ya no queda ninguna tarifa sin confirmar.
 */

export type ServiceId = 'driver-by-tour' | 'personal-driver'

type Text = Record<Locale, string>
type List = Record<Locale, string[]>

/* ------------------------------------------------------------------ */
/* Condiciones comerciales                                             */
/* ------------------------------------------------------------------ */

/** Horas mínimas contratables del Personal Driver. */
export const MIN_HOURS = 3

/** Tarifa por hora del Personal Driver, en dólares. */
export const HOURLY_USD = 15

/** Guía turístico bilingüe como complemento, por DÍA de servicio. */
export const GUIDE_PER_DAY_USD = 75

/** Capacidad comercial del vehículo: una sola cifra en todo el sitio. */
export const VEHICLE_SEATS = 6

/** Recorrido del Driver by Tour: dólares por kilómetro. */
export const PER_KM_USD = 0.75

/**
 * Tiempo de espera, por hora. Se suma al recorrido cuando el conductor
 * espera al cliente en una parada.
 *
 * EXCEPCIÓN confirmada: en las rutas que recogen en varios puntos y
 * terminan en uno solo —un traslado, no un recorrido con paradas— no se
 * cobra espera, solo el viaje. El cotizador automático tendrá que
 * distinguir los dos casos antes de sumar nada por este concepto.
 */
export const WAITING_PER_HOUR_USD = 5

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
      ES: 'Microbús Chevrolet N400 para seis pasajeros',
      EN: 'Chevrolet N400 minibus for six passengers',
    } satisfies Text,
  },
  features: {
    ES: ['Aire acondicionado', `Hasta ${VEHICLE_SEATS} pasajeros`, 'Espacio para equipaje', 'Conductor local'],
    EN: ['Air conditioning', `Up to ${VEHICLE_SEATS} passengers`, 'Room for luggage', 'Local driver'],
  } satisfies List,
} as const

/* ------------------------------------------------------------------ */
/* Servicios                                                           */
/* ------------------------------------------------------------------ */

export type Service = {
  id: ServiceId
  /** Nombre comercial. NO se traduce: es el nombre de la oferta. */
  name: string
  /** Frase corta bajo el nombre, en la tarjeta. */
  tagline: Text
  /** Una línea en la tarjeta de la portada. */
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
  /**
   * La misma unidad en el catálogo UN/CEFACT, para los datos
   * estructurados: HUR (hora) o KMT (kilómetro).
   */
  priceUnitCode: 'HUR' | 'KMT'
  /** Condición que acompaña al precio (mínimo de horas, exclusiones…). */
  priceNote: Text | null
  /** Clave del icono, resuelta en el componente. */
  icon: 'route' | 'car'
  highlights: List
  includes: List
  excludes: List
  /** Lo que conviene saber antes de escribir. */
  notes: List
}

export const services: Service[] = [
  {
    id: 'driver-by-tour',
    name: 'Driver by Tour',
    tagline: {
      ES: 'Conductor para un tour concreto',
      EN: 'A driver for one specific tour',
    },
    summary: {
      ES: 'Nos encargamos del traslado completo de tu tour: te recogemos, te llevamos y te devolvemos.',
      EN: 'We handle the full ride for your tour: we pick you up, take you there and bring you back.',
    },
    description: {
      ES: 'Conductor y vehículo para una ruta concreta: el volcán de Santa Ana, la Ruta de las Flores, Suchitoto, la costa de La Libertad o el itinerario que ya tengas en mente. Te recogemos en tu hotel o alojamiento, te acompañamos durante el recorrido y te devolvemos al punto de partida. Se cotiza por ruta, así que el precio se ajusta a la distancia real y no a un paquete cerrado.',
      EN: 'Driver and vehicle for one specific route: the Santa Ana volcano, the Ruta de las Flores, Suchitoto, the La Libertad coast or whatever itinerary you already have in mind. We pick you up at your hotel or rental, stay with you along the way and bring you back to the starting point. It is quoted per route, so the price follows the real distance instead of a fixed package.',
    },
    priceFromUsd: PER_KM_USD,
    // «por km», no «por kilómetro»: con la palabra entera, en el móvil la
    // línea del precio se parte y las dos tarjetas dejan de ir a la par.
    priceUnit: { ES: 'por km', EN: 'per km' },
    priceUnitCode: 'KMT',
    priceNote: {
      ES: `Más $${WAITING_PER_HOUR_USD} por hora de espera · te damos el total antes de que decidas`,
      EN: `Plus $${WAITING_PER_HOUR_USD} per hour of waiting · you get the total before you decide`,
    },
    icon: 'route',
    highlights: {
      ES: ['Recogida en tu hotel o alojamiento', 'Ruta y paradas acordadas contigo', 'Conductor que conoce el camino'],
      EN: ['Pickup at your hotel or rental', 'Route and stops agreed with you', 'A driver who knows the road'],
    },
    includes: {
      ES: [`Microbús ${vehicle.model} con aire acondicionado`, 'Conductor durante todo el recorrido', `Hasta ${VEHICLE_SEATS} pasajeros`, 'Ida y vuelta al punto de recogida'],
      EN: [`${vehicle.model} minibus with air conditioning`, 'Driver for the whole route', `Up to ${VEHICLE_SEATS} passengers`, 'Round trip to the pickup point'],
    },
    excludes: {
      ES: ['Entradas a parques o miradores', 'Comidas y bebidas', 'Guía turístico bilingüe (complemento aparte)', 'Propinas'],
      EN: ['Park or viewpoint entrance fees', 'Food and drinks', 'Bilingual tour guide (separate add-on)', 'Tips'],
    },
    notes: {
      ES: [
        `El total sale de la distancia del recorrido, a $${PER_KM_USD} por kilómetro, más $${WAITING_PER_HOUR_USD} por cada hora que el conductor te espere en una parada.`,
        'Si solo necesitas que te llevemos de un sitio a otro, aunque recojamos en varios puntos, no se cobra espera: pagas únicamente el viaje.',
        'Para rutas de madrugada, como el amanecer en el volcán de Santa Ana, conviene avisar con un día de antelación.',
      ],
      EN: [
        `The total comes from the distance of the route, at $${PER_KM_USD} per kilometre, plus $${WAITING_PER_HOUR_USD} for every hour the driver waits for you at a stop.`,
        'If you only need to get from one place to another, even with several pickup points, there is no waiting charge: you pay for the ride alone.',
        'For early-morning routes, such as sunrise on the Santa Ana volcano, it is best to ask a day ahead.',
      ],
    },
  },
  {
    id: 'personal-driver',
    name: 'Personal Driver',
    tagline: {
      ES: 'Tu propio itinerario, por horas',
      EN: 'Your own itinerary, by the hour',
    },
    summary: {
      ES: 'Vehículo con conductor a tu disposición: decides a dónde vas y cuánto te quedas en cada sitio.',
      EN: 'A vehicle with driver at your disposal: you decide where to go and how long to stay.',
    },
    description: {
      ES: 'Alquilas el microbús con conductor por horas y organizas tu propio recorrido por El Salvador. Sin itinerario fijo: paras donde quieras, cambias de plan a mitad del día y el conductor te espera. Es la opción de quien ya sabe qué quiere ver, viaja en familia o en grupo pequeño, o necesita moverse varios días seguidos.',
      EN: 'You hire the minibus with a driver by the hour and plan your own route around El Salvador. No fixed itinerary: stop wherever you want, change plans halfway through the day and the driver waits for you. It suits travellers who already know what they want to see, families and small groups, or anyone who needs to move around for several days.',
    },
    priceFromUsd: HOURLY_USD,
    priceUnit: { ES: 'por hora', EN: 'per hour' },
    priceUnitCode: 'HUR',
    priceNote: {
      ES: `Mínimo ${MIN_HOURS} horas · gasolina no incluida`,
      EN: `${MIN_HOURS}-hour minimum · fuel not included`,
    },
    icon: 'car',
    highlights: {
      ES: [`Desde ${MIN_HOURS} horas`, 'Las paradas y los horarios los decides tú', 'El conductor te espera'],
      EN: [`From ${MIN_HOURS} hours`, 'You set the stops and the timing', 'The driver waits for you'],
    },
    includes: {
      ES: [`Microbús ${vehicle.model} con aire acondicionado`, 'Conductor por las horas contratadas', `Hasta ${VEHICLE_SEATS} pasajeros`, 'Itinerario libre dentro del horario'],
      EN: [`${vehicle.model} minibus with air conditioning`, 'Driver for the hours booked', `Up to ${VEHICLE_SEATS} passengers`, 'Free itinerary within the agreed hours'],
    },
    excludes: {
      ES: ['Gasolina', 'Entradas, comidas y bebidas', 'Guía turístico bilingüe (complemento aparte)', 'Propinas'],
      EN: ['Fuel', 'Entrance fees, food and drinks', 'Bilingual tour guide (separate add-on)', 'Tips'],
    },
    notes: {
      ES: [
        `El servicio se contrata por un mínimo de ${MIN_HOURS} horas.`,
        'La gasolina no está incluida en la tarifa por hora.',
        'Para varios días seguidos, escríbenos: ajustamos el horario y el total.',
      ],
      EN: [
        `The service is booked for a minimum of ${MIN_HOURS} hours.`,
        'Fuel is not included in the hourly rate.',
        'For several days in a row, write to us: we adjust the schedule and the total.',
      ],
    },
  },
]

/* ------------------------------------------------------------------ */
/* Complemento                                                         */
/* ------------------------------------------------------------------ */

/**
 * Guía turístico bilingüe. Es un COMPLEMENTO de los dos servicios, no un
 * tercer servicio: se muestra dentro de la sección, nunca como tarjeta
 * propia.
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
    ES: 'Súmalo a cualquiera de los dos servicios y alguien te cuenta, en inglés o en español, lo que estás viendo.',
    EN: 'Add it to either service and someone tells you what you are seeing, in English or Spanish.',
  } satisfies Text,
} as const

/** Busca un servicio por su id (el id es también el slug de su página). */
export function getService(id: string): Service | undefined {
  return services.find((service) => service.id === id)
}
