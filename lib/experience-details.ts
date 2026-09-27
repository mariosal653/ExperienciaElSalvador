import type { Locale } from './data'

/**
 * Información práctica de cada experiencia: itinerario, qué incluye, punto
 * de encuentro, qué llevar y galería.
 *
 * Es lo que un viajero compara antes de pagar en GetYourGuide o Viator, y
 * lo que más preguntas ahorra por WhatsApp.
 *
 * IMPORTANTE: los horarios, lo incluido y los puntos de encuentro son una
 * propuesta coherente con la descripción y la duración de cada experiencia.
 * Deben confirmarse con cada operador antes de publicar. Cambiarlos es
 * editar este archivo: la interfaz no tiene nada escrito a mano.
 *
 * Las fotos de la galería solo muestran el lugar real de la experiencia
 * (autoría y licencia en lib/credits.ts).
 */

export type Difficulty = 'easy' | 'moderate' | 'challenging'

type Text = Record<Locale, string>
type List = Record<Locale, string[]>

export type ItineraryStep = { time: string; text: Text }

export type ExperienceDetails = {
  /** Fotos adicionales a la principal del catálogo. */
  gallery: { src: string; alt: Text }[]
  itinerary: ItineraryStep[]
  includes: List
  excludes: List
  bring: List
  /** Avisos que conviene leer antes de reservar. */
  notes?: List
  meetingPoint: {
    name: Text
    /** Texto de búsqueda para Google Maps (no necesita clave de API). */
    mapQuery: string
  }
  difficulty: Difficulty
  /** Edad mínima; 0 = apto para todas las edades. */
  minAge: number
  languages: Locale[]
}

export const DIFFICULTY_LABEL: Record<Difficulty, Text> = {
  easy: { ES: 'Fácil', EN: 'Easy' },
  moderate: { ES: 'Moderada', EN: 'Moderate' },
  challenging: { ES: 'Exigente', EN: 'Challenging' },
}

/** Política vigente (ver /legal/cancellation). Se usa en insignias y bloques. */
export const FREE_CANCELLATION_HOURS = 48

const IMG = {
  santaAnaCrater: {
    src: '/img/reels/santa-ana.jpg',
    alt: { ES: 'Laguna del cráter del volcán de Santa Ana', EN: 'Crater lagoon of the Santa Ana volcano' },
  },
  losVolcanes: {
    src: '/img/categoria-volcanes.jpg',
    alt: { ES: 'Complejo Los Volcanes: Izalco, Cerro Verde y Santa Ana', EN: 'Los Volcanes complex: Izalco, Cerro Verde and Santa Ana' },
  },
  cerroVerdeIzalco: {
    src: '/img/hero/cerro-verde-izalco-960.jpg',
    alt: { ES: 'Cerro Verde y el volcán de Izalco', EN: 'Cerro Verde and Izalco volcano' },
  },
  izalco: {
    src: '/img/experiences/volcan-izalco.jpg',
    alt: { ES: 'Volcán de Izalco visto desde Cerro Verde', EN: 'Izalco volcano seen from Cerro Verde' },
  },
  tuncoRock: {
    src: '/img/categoria-playas.jpg',
    alt: { ES: 'La roca de El Tunco', EN: 'El Tunco rock' },
  },
  tuncoBeach: {
    src: '/img/reels/el-tunco.jpg',
    alt: { ES: 'Playa de El Tunco', EN: 'El Tunco beach' },
  },
  sunzal: {
    src: '/img/experiences/surf-city-el-sunzal.jpg',
    alt: { ES: 'Palmeras y ola en la playa El Sunzal', EN: 'Palms and a wave at El Sunzal beach' },
  },
  suchitotoStreet: {
    src: '/img/reels/suchitoto.jpg',
    alt: { ES: 'Calle empedrada de Suchitoto', EN: 'Cobblestone street in Suchitoto' },
  },
  santaLucia: {
    src: '/img/categoria-cultura.jpg',
    alt: { ES: 'Iglesia de Santa Lucía, Suchitoto', EN: 'Santa Lucía church, Suchitoto' },
  },
}

const ID_DOC: List = {
  ES: ['Documento de identidad (DUI o pasaporte)'],
  EN: ['ID or passport'],
}

export const experienceDetails: Record<string, ExperienceDetails> = {
  'volcan-santa-ana': {
    gallery: [IMG.losVolcanes, IMG.cerroVerdeIzalco],
    itinerary: [
      { time: '7:00', text: { ES: 'Encuentro en el Parque Nacional Cerro Verde y charla de seguridad', EN: 'Meet at Cerro Verde National Park for a safety briefing' } },
      { time: '7:30', text: { ES: 'Inicio del sendero entre fincas de café y bosque de pino', EN: 'Start the trail through coffee farms and pine forest' } },
      { time: '10:00', text: { ES: 'Llegada al cráter y mirador de la laguna turquesa', EN: 'Reach the crater and the turquoise lagoon viewpoint' } },
      { time: '11:00', text: { ES: 'Descenso con paradas en miradores del lago de Coatepeque', EN: 'Descend with stops at Lake Coatepeque viewpoints' } },
      { time: '13:00', text: { ES: 'Almuerzo típico en el parque (opcional)', EN: 'Traditional lunch in the park (optional)' } },
      { time: '15:00', text: { ES: 'Regreso al punto de encuentro', EN: 'Back at the meeting point' } },
    ],
    includes: {
      ES: ['Guía local', 'Entrada al parque y al sendero', 'Agua y un refrigerio', 'Botiquín de primeros auxilios'],
      EN: ['Local guide', 'Park and trail entry', 'Water and a snack', 'First-aid kit'],
    },
    excludes: {
      ES: ['Transporte hasta el punto de encuentro', 'Almuerzo', 'Propinas'],
      EN: ['Transport to the meeting point', 'Lunch', 'Tips'],
    },
    bring: {
      ES: ['Zapatos de montaña o tenis con buen agarre', 'Chaqueta ligera: en la cima hace frío', 'Bloqueador y gorra', '1,5 L de agua', ...ID_DOC.ES],
      EN: ['Hiking boots or sneakers with good grip', 'A light jacket: it gets cold at the top', 'Sunscreen and a hat', '1.5 L of water', ...ID_DOC.EN],
    },
    meetingPoint: {
      name: { ES: 'Parque Nacional Cerro Verde, estacionamiento principal', EN: 'Cerro Verde National Park, main parking lot' },
      mapQuery: 'Parque Nacional Cerro Verde, El Salvador',
    },
    difficulty: 'moderate',
    minAge: 8,
    languages: ['ES', 'EN'],
  },

  'atardecer-el-tunco': {
    gallery: [IMG.tuncoRock, IMG.tuncoBeach],
    itinerary: [
      { time: '15:00', text: { ES: 'Encuentro en la entrada de la playa El Tunco', EN: 'Meet at the El Tunco beach entrance' } },
      { time: '15:30', text: { ES: 'Paseo por el pueblo y la playa de arena oscura', EN: 'Walk through the village and the dark-sand beach' } },
      { time: '16:30', text: { ES: 'Surfistas en las olas de la tarde', EN: 'Watch surfers on the evening waves' } },
      { time: '17:30', text: { ES: 'Atardecer frente a la roca de El Tunco', EN: 'Sunset in front of El Tunco rock' } },
      { time: '19:00', text: { ES: 'Fin de la experiencia en el pueblo', EN: 'Experience ends in the village' } },
    ],
    includes: {
      ES: ['Guía local', 'Bebida de bienvenida', 'Fotos del atardecer con tu celular'],
      EN: ['Local guide', 'Welcome drink', 'Sunset photos on your phone'],
    },
    excludes: {
      ES: ['Transporte', 'Cena', 'Propinas'],
      EN: ['Transport', 'Dinner', 'Tips'],
    },
    bring: {
      ES: ['Sandalias', 'Bloqueador y repelente', 'Ropa de cambio'],
      EN: ['Sandals', 'Sunscreen and insect repellent', 'A change of clothes'],
    },
    meetingPoint: {
      name: { ES: 'Entrada principal de la playa El Tunco', EN: 'Main entrance to El Tunco beach' },
      mapQuery: 'Playa El Tunco, La Libertad, El Salvador',
    },
    difficulty: 'easy',
    minAge: 0,
    languages: ['ES', 'EN'],
  },

  'ruta-de-las-flores': {
    gallery: [],
    itinerary: [
      { time: '8:00', text: { ES: 'Nahuizalco: mercado de artesanías de tule y madera', EN: 'Nahuizalco: reed and wood handicraft market' } },
      { time: '9:30', text: { ES: 'Salcoatitán y sus murales', EN: 'Salcoatitán and its murals' } },
      { time: '10:30', text: { ES: 'Juayúa: iglesia del Cristo Negro y feria gastronómica', EN: 'Juayúa: Black Christ church and food fair' } },
      { time: '13:00', text: { ES: 'Apaneca: finca de café y miradores de montaña', EN: 'Apaneca: coffee farm and mountain viewpoints' } },
      { time: '15:30', text: { ES: 'Concepción de Ataco: calles de murales', EN: 'Concepción de Ataco: mural-lined streets' } },
      { time: '18:00', text: { ES: 'Regreso a Nahuizalco', EN: 'Back in Nahuizalco' } },
    ],
    includes: {
      ES: ['Guía local', 'Transporte entre los cinco pueblos', 'Degustación de café de altura'],
      EN: ['Local guide', 'Transport between the five towns', 'Highland coffee tasting'],
    },
    excludes: {
      ES: ['Transporte hasta Nahuizalco', 'Almuerzo', 'Compras de artesanías'],
      EN: ['Transport to Nahuizalco', 'Lunch', 'Handicraft purchases'],
    },
    bring: {
      ES: ['Zapatos cómodos para caminar', 'Suéter: en Apaneca refresca', 'Efectivo para la feria y artesanías'],
      EN: ['Comfortable walking shoes', 'A sweater: Apaneca gets cool', 'Cash for the food fair and crafts'],
    },
    meetingPoint: {
      name: { ES: 'Parque central de Nahuizalco', EN: 'Nahuizalco central park' },
      mapQuery: 'Parque Central Nahuizalco, Sonsonate, El Salvador',
    },
    difficulty: 'easy',
    minAge: 0,
    languages: ['ES', 'EN'],
  },

  'kayak-coatepeque': {
    gallery: [],
    itinerary: [
      { time: '9:00', text: { ES: 'Encuentro en la orilla del lago y entrega del equipo', EN: 'Meet on the lakeshore and get your gear' } },
      { time: '9:30', text: { ES: 'Instrucción básica de remo y seguridad', EN: 'Basic paddling and safety instruction' } },
      { time: '10:00', text: { ES: 'Remada hacia la isla Teopán', EN: 'Paddle toward Teopán island' } },
      { time: '12:30', text: { ES: 'Baño en el lago y descanso', EN: 'Swim in the lake and rest' } },
      { time: '15:00', text: { ES: 'Regreso a la orilla y fin de la experiencia', EN: 'Back to shore; experience ends' } },
    ],
    includes: {
      ES: ['Kayak, remo y chaleco salvavidas', 'Guía local', 'Agua'],
      EN: ['Kayak, paddle and life jacket', 'Local guide', 'Water'],
    },
    excludes: {
      ES: ['Transporte', 'Almuerzo', 'Propinas'],
      EN: ['Transport', 'Lunch', 'Tips'],
    },
    bring: {
      ES: ['Traje de baño y toalla', 'Bloqueador resistente al agua', 'Gorra o sombrero', 'Bolsa seca para el celular'],
      EN: ['Swimsuit and towel', 'Water-resistant sunscreen', 'Cap or hat', 'Dry bag for your phone'],
    },
    notes: {
      ES: ['Sale temprano: a mediodía el sol es fuerte.'],
      EN: ['We start early: the midday sun is strong.'],
    },
    meetingPoint: {
      name: { ES: 'Orilla del lago de Coatepeque', EN: 'Lake Coatepeque shore' },
      mapQuery: 'Lago de Coatepeque, El Salvador',
    },
    difficulty: 'easy',
    minAge: 6,
    languages: ['ES', 'EN'],
  },

  'surf-el-zonte': {
    gallery: [],
    itinerary: [
      { time: '7:00', text: { ES: 'Encuentro en la escuela de surf, calentamiento y seguridad', EN: 'Meet at the surf school; warm-up and safety' } },
      { time: '7:20', text: { ES: 'Técnica de remada y puesta de pie en la arena', EN: 'Paddling technique and pop-ups on the sand' } },
      { time: '7:40', text: { ES: 'Práctica en el agua con el instructor', EN: 'Practice in the water with your instructor' } },
      { time: '9:00', text: { ES: 'Fin de la clase', EN: 'Lesson ends' } },
    ],
    includes: {
      ES: ['Instructor local', 'Tabla de surf', 'Licra'],
      EN: ['Local instructor', 'Surfboard', 'Rash guard'],
    },
    excludes: {
      ES: ['Transporte', 'Fotos o video de la clase', 'Propinas'],
      EN: ['Transport', 'Photos or video of the lesson', 'Tips'],
    },
    bring: {
      ES: ['Traje de baño', 'Bloqueador resistente al agua', 'Toalla'],
      EN: ['Swimsuit', 'Water-resistant sunscreen', 'Towel'],
    },
    notes: {
      ES: ['Es necesario saber nadar.'],
      EN: ['You must be able to swim.'],
    },
    meetingPoint: {
      name: { ES: 'Playa El Zonte, escuela de surf', EN: 'El Zonte beach, surf school' },
      mapQuery: 'Playa El Zonte, La Libertad, El Salvador',
    },
    difficulty: 'easy',
    minAge: 8,
    languages: ['ES', 'EN'],
  },

  'centro-historico-san-salvador': {
    gallery: [],
    itinerary: [
      { time: '9:00', text: { ES: 'Plaza Gerardo Barrios y Catedral Metropolitana', EN: 'Gerardo Barrios Square and Metropolitan Cathedral' } },
      { time: '9:45', text: { ES: 'Palacio Nacional', EN: 'National Palace' } },
      { time: '10:30', text: { ES: 'Teatro Nacional', EN: 'National Theatre' } },
      { time: '11:15', text: { ES: 'Plaza Libertad e iglesia El Rosario', EN: 'Plaza Libertad and El Rosario church' } },
      { time: '12:00', text: { ES: 'Fin del recorrido', EN: 'Tour ends' } },
    ],
    includes: {
      ES: ['Guía local', 'Recorrido a pie', 'Agua'],
      EN: ['Local guide', 'Walking tour', 'Water'],
    },
    excludes: {
      ES: ['Entradas a museos', 'Comida', 'Propinas'],
      EN: ['Museum tickets', 'Food', 'Tips'],
    },
    bring: {
      ES: ['Zapatos cómodos', 'Gorra y bloqueador', 'Ropa que cubra hombros para entrar a las iglesias'],
      EN: ['Comfortable shoes', 'Cap and sunscreen', 'Clothes covering shoulders to enter churches'],
    },
    meetingPoint: {
      name: { ES: 'Frente a la Catedral Metropolitana', EN: 'In front of the Metropolitan Cathedral' },
      mapQuery: 'Catedral Metropolitana de San Salvador',
    },
    difficulty: 'easy',
    minAge: 0,
    languages: ['ES', 'EN'],
  },

  'bosque-nuboso': {
    gallery: [],
    itinerary: [
      { time: '7:00', text: { ES: 'Encuentro y registro en la entrada del parque', EN: 'Meet and check in at the park entrance' } },
      { time: '7:30', text: { ES: 'Subida en vehículo 4x4 hacia la zona alta', EN: '4x4 ride up to the highlands' } },
      { time: '9:00', text: { ES: 'Sendero entre robles y pinos cubiertos de musgo', EN: 'Trail among moss-covered oaks and pines' } },
      { time: '10:30', text: { ES: 'Mirador hacia la región del trifinio', EN: 'Viewpoint over the tri-border region' } },
      { time: '12:00', text: { ES: 'Regreso a la entrada del parque', EN: 'Back at the park entrance' } },
    ],
    includes: {
      ES: ['Guía local', 'Traslado 4x4 dentro del parque', 'Entrada al parque', 'Agua'],
      EN: ['Local guide', '4x4 transfer inside the park', 'Park entry', 'Water'],
    },
    excludes: {
      ES: ['Transporte hasta Metapán', 'Comida', 'Propinas'],
      EN: ['Transport to Metapán', 'Food', 'Tips'],
    },
    bring: {
      ES: ['Zapatos de montaña', 'Chaqueta impermeable: el bosque es húmedo y frío', 'Repelente', ...ID_DOC.ES],
      EN: ['Hiking boots', 'A rain jacket: the forest is damp and cold', 'Insect repellent', ...ID_DOC.EN],
    },
    notes: {
      ES: ['El acceso a la zona del bosque nuboso depende de las disposiciones del parque. Si está cerrada, hacemos la ruta por los senderos abiertos y te avisamos antes.'],
      EN: ['Access to the cloud forest area depends on park rules. If it is closed, we take the open trails and let you know in advance.'],
    },
    meetingPoint: {
      name: { ES: 'Entrada del Parque Nacional Montecristo, Metapán', EN: 'Montecristo National Park entrance, Metapán' },
      mapQuery: 'Parque Nacional Montecristo, Metapán, El Salvador',
    },
    difficulty: 'moderate',
    minAge: 10,
    languages: ['ES', 'EN'],
  },

  'suchitoto-colonial': {
    gallery: [IMG.santaLucia],
    itinerary: [
      { time: '9:00', text: { ES: 'Iglesia de Santa Lucía y parque central', EN: 'Santa Lucía church and central park' } },
      { time: '9:45', text: { ES: 'Calles empedradas y galerías de arte', EN: 'Cobblestone streets and art galleries' } },
      { time: '11:00', text: { ES: 'Demostración de teñido con añil', EN: 'Indigo dyeing demonstration' } },
      { time: '12:30', text: { ES: 'Almuerzo libre', EN: 'Free time for lunch' } },
      { time: '14:00', text: { ES: 'Paseo en lancha por el lago Suchitlán', EN: 'Boat ride on Lake Suchitlán' } },
      { time: '16:00', text: { ES: 'Fin de la experiencia', EN: 'Experience ends' } },
    ],
    includes: {
      ES: ['Guía local', 'Paseo en lancha', 'Demostración de añil'],
      EN: ['Local guide', 'Boat ride', 'Indigo demonstration'],
    },
    excludes: {
      ES: ['Transporte hasta Suchitoto', 'Almuerzo', 'Compras'],
      EN: ['Transport to Suchitoto', 'Lunch', 'Purchases'],
    },
    bring: {
      ES: ['Zapatos cómodos para el empedrado', 'Gorra y bloqueador', 'Efectivo para artesanías'],
      EN: ['Comfortable shoes for cobblestones', 'Cap and sunscreen', 'Cash for crafts'],
    },
    meetingPoint: {
      name: { ES: 'Parque central de Suchitoto, frente a la iglesia', EN: 'Suchitoto central park, in front of the church' },
      mapQuery: 'Iglesia Santa Lucía, Suchitoto, El Salvador',
    },
    difficulty: 'easy',
    minAge: 0,
    languages: ['ES', 'EN'],
  },

  'surf-city-ruta': {
    gallery: [IMG.tuncoRock, IMG.tuncoBeach],
    itinerary: [
      { time: '8:00', text: { ES: 'Encuentro en la playa El Sunzal', EN: 'Meet at El Sunzal beach' } },
      { time: '8:30', text: { ES: 'Rompientes de El Sunzal y El Tunco', EN: 'The El Sunzal and El Tunco breaks' } },
      { time: '10:00', text: { ES: 'Miradores de la costa del Pacífico', EN: 'Pacific coast viewpoints' } },
      { time: '11:30', text: { ES: 'Parada en una playa tranquila para bañarse', EN: 'Stop at a quiet beach for a swim' } },
      { time: '13:00', text: { ES: 'Regreso a El Sunzal', EN: 'Back at El Sunzal' } },
    ],
    includes: {
      ES: ['Guía local', 'Transporte entre playas', 'Agua de coco'],
      EN: ['Local guide', 'Transport between beaches', 'Fresh coconut water'],
    },
    excludes: {
      ES: ['Transporte hasta El Sunzal', 'Comida', 'Propinas'],
      EN: ['Transport to El Sunzal', 'Food', 'Tips'],
    },
    bring: {
      ES: ['Traje de baño y toalla', 'Bloqueador', 'Cámara o celular con batería'],
      EN: ['Swimsuit and towel', 'Sunscreen', 'Camera or charged phone'],
    },
    meetingPoint: {
      name: { ES: 'Playa El Sunzal', EN: 'El Sunzal beach' },
      mapQuery: 'Playa El Sunzal, La Libertad, El Salvador',
    },
    difficulty: 'easy',
    minAge: 0,
    languages: ['ES', 'EN'],
  },

  'volcan-izalco': {
    gallery: [IMG.cerroVerdeIzalco, IMG.losVolcanes],
    itinerary: [
      { time: '7:00', text: { ES: 'Encuentro en el Parque Nacional Cerro Verde y charla de seguridad', EN: 'Meet at Cerro Verde National Park for a safety briefing' } },
      { time: '8:00', text: { ES: 'Descenso por escalones en el bosque hasta la base del Izalco', EN: 'Descend forest steps to the base of Izalco' } },
      { time: '9:30', text: { ES: 'Ascenso por roca volcánica suelta', EN: 'Climb over loose volcanic rock' } },
      { time: '11:30', text: { ES: 'Cumbre del cono y vistas al Pacífico', EN: 'Summit of the cone with Pacific views' } },
      { time: '12:30', text: { ES: 'Descenso del cono', EN: 'Descend the cone' } },
      { time: '14:30', text: { ES: 'Subida de regreso a Cerro Verde', EN: 'Climb back up to Cerro Verde' } },
      { time: '16:00', text: { ES: 'Fin de la experiencia', EN: 'Experience ends' } },
    ],
    includes: {
      ES: ['Guía local', 'Entrada al parque', 'Agua y un refrigerio', 'Botiquín de primeros auxilios'],
      EN: ['Local guide', 'Park entry', 'Water and a snack', 'First-aid kit'],
    },
    excludes: {
      ES: ['Transporte hasta el punto de encuentro', 'Almuerzo', 'Propinas'],
      EN: ['Transport to the meeting point', 'Lunch', 'Tips'],
    },
    bring: {
      ES: ['Botas de montaña (obligatorio)', 'Guantes para la roca suelta', '2 L de agua', 'Bloqueador y gorra', ...ID_DOC.ES],
      EN: ['Hiking boots (required)', 'Gloves for the loose rock', '2 L of water', 'Sunscreen and a hat', ...ID_DOC.EN],
    },
    notes: {
      ES: ['Ruta exigente: se necesita buena condición física.'],
      EN: ['Demanding route: good physical fitness required.'],
    },
    meetingPoint: {
      name: { ES: 'Parque Nacional Cerro Verde, estacionamiento principal', EN: 'Cerro Verde National Park, main parking lot' },
      mapQuery: 'Parque Nacional Cerro Verde, El Salvador',
    },
    difficulty: 'challenging',
    minAge: 14,
    languages: ['ES', 'EN'],
  },

  'malecon-la-libertad': {
    gallery: [],
    itinerary: [
      { time: '10:00', text: { ES: 'Encuentro en la entrada del muelle', EN: 'Meet at the pier entrance' } },
      { time: '10:15', text: { ES: 'Recorrido por el muelle y llegada de las lanchas', EN: 'Walk the pier and watch the boats come in' } },
      { time: '11:00', text: { ES: 'Mercado de mariscos del puerto', EN: 'Harbor seafood market' } },
      { time: '12:00', text: { ES: 'Degustación de mariscos frescos', EN: 'Fresh seafood tasting' } },
      { time: '13:00', text: { ES: 'Paseo por el malecón', EN: 'Stroll along the waterfront' } },
      { time: '14:00', text: { ES: 'Fin de la experiencia', EN: 'Experience ends' } },
    ],
    includes: {
      ES: ['Guía local', 'Degustación de mariscos'],
      EN: ['Local guide', 'Seafood tasting'],
    },
    excludes: {
      ES: ['Transporte', 'Comida adicional', 'Propinas'],
      EN: ['Transport', 'Additional food', 'Tips'],
    },
    bring: {
      ES: ['Gorra y bloqueador', 'Efectivo para el mercado'],
      EN: ['Cap and sunscreen', 'Cash for the market'],
    },
    notes: {
      ES: ['Avísanos al reservar si tienes alergia a los mariscos.'],
      EN: ['Let us know when booking if you have a seafood allergy.'],
    },
    meetingPoint: {
      name: { ES: 'Entrada del muelle del Puerto de La Libertad', EN: 'Puerto de La Libertad pier entrance' },
      mapQuery: 'Muelle Puerto de La Libertad, El Salvador',
    },
    difficulty: 'easy',
    minAge: 0,
    languages: ['ES', 'EN'],
  },
}

export function getExperienceDetails(id: string): ExperienceDetails | null {
  return experienceDetails[id] ?? null
}

/** URL de Google Maps embebido, sin clave de API. */
export function mapEmbedUrl(query: string, lang: Locale): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=${lang === 'ES' ? 'es' : 'en'}&z=14&output=embed`
}

/** Enlace para abrir el punto en Google Maps (app o web). */
export function mapLinkUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
