/**
 * Datos del catálogo y lógica de filtrado.
 *
 * Es la única fuente de verdad del contenido mientras no exista backend.
 * Las funciones de filtrado son puras: reciben datos y criterios, devuelven
 * datos. Eso permite moverlas al servidor sin tocar la interfaz.
 */

export type Locale = 'ES' | 'EN'

export type CategoryId = 'playas' | 'volcanes' | 'cultura' | 'aventura'

export type Category = {
  id: CategoryId
  label: Record<Locale, string>
  /**
   * Clave del icono. Se resuelve en la página contra los iconos de lucide
   * que ya usaba el prototipo, para no introducir importaciones nuevas.
   */
  icon: 'waves' | 'compass' | 'sparkles' | 'shield'
  image: string
}

export type Experience = {
  id: string
  title: string
  /** Debe coincidir con el `name` de un destino. */
  destination: string
  category: CategoryId
  priceUsd: number
  rating: number
  reviews: number
  durationHours: number
  image: string
  imageAlt: Record<Locale, string>
  tag?: Record<Locale, string>
  /** Capacidad máxima del grupo. Filtra por número de viajeros. */
  maxPeople: number
  /** Días en que sale la experiencia. 0 = domingo … 6 = sábado. */
  weekdays: number[]
  /** Texto de la página de detalle y de la meta description. */
  description: Record<Locale, string>
  highlights: Record<Locale, string[]>
}

export type Destination = {
  id: string
  name: string
  region: Record<Locale, string>
}

/* ------------------------------------------------------------------ */
/* Imágenes                                                            */
/* ------------------------------------------------------------------ */

/**
 * Imágenes de Cultura y Aventura.
 *
 * Fotografías reales de El Salvador, de Wikimedia Commons, servidas desde
 * /public/img a 500 px de ancho (la tarjeta mide ~160 px: sobra para
 * pantallas 2x y pesan ~70 KB). Autoría y licencia en lib/credits.ts,
 * visibles en /credits: las licencias CC BY y CC BY-SA obligan a citarlas.
 *
 *   Cultura   Iglesia de Santa Lucía, Suchitoto
 *   Aventura  Laguna del cráter del volcán de Santa Ana
 *
 * Los .svg anteriores se conservan como respaldo de marca.
 */
const IMG_CULTURA = '/img/categoria-cultura.jpg'
const IMG_AVENTURA = '/img/categoria-aventura.jpg'

/* ------------------------------------------------------------------ */
/* Destinos                                                            */
/* ------------------------------------------------------------------ */

export const destinations: Destination[] = [
  { id: 'san-salvador', name: 'San Salvador', region: { ES: 'San Salvador', EN: 'San Salvador' } },
  { id: 'santa-ana', name: 'Santa Ana', region: { ES: 'Santa Ana', EN: 'Santa Ana' } },
  { id: 'ruta-de-las-flores', name: 'Ruta de las Flores', region: { ES: 'Ahuachapán y Sonsonate', EN: 'Ahuachapán & Sonsonate' } },
  { id: 'el-tunco', name: 'El Tunco', region: { ES: 'La Libertad', EN: 'La Libertad' } },
  { id: 'el-zonte', name: 'El Zonte', region: { ES: 'La Libertad', EN: 'La Libertad' } },
  { id: 'suchitoto', name: 'Suchitoto', region: { ES: 'Cuscatlán', EN: 'Cuscatlán' } },
  { id: 'lago-de-coatepeque', name: 'Lago de Coatepeque', region: { ES: 'Santa Ana', EN: 'Santa Ana' } },
  { id: 'volcan-de-santa-ana', name: 'Volcán de Santa Ana', region: { ES: 'Santa Ana', EN: 'Santa Ana' } },
  { id: 'la-libertad', name: 'La Libertad', region: { ES: 'La Libertad', EN: 'La Libertad' } },
  { id: 'surf-city', name: 'Surf City', region: { ES: 'Costa de La Libertad', EN: 'La Libertad coast' } },
]

/* ------------------------------------------------------------------ */
/* Categorías                                                          */
/* ------------------------------------------------------------------ */

export const categories: Category[] = [
  {
    id: 'playas',
    label: { ES: 'Playas', EN: 'Beaches' },
    icon: 'waves',
    // Roca de El Tunco, La Libertad (créditos en lib/credits.ts).
    image: '/img/categoria-playas.jpg',
  },
  {
    id: 'volcanes',
    label: { ES: 'Volcanes', EN: 'Volcanoes' },
    icon: 'compass',
    // Complejo Los Volcanes: Izalco, Cerro Verde y Santa Ana.
    image: '/img/categoria-volcanes.jpg',
  },
  {
    id: 'cultura',
    label: { ES: 'Cultura', EN: 'Culture' },
    icon: 'sparkles',
    image: IMG_CULTURA,
  },
  {
    id: 'aventura',
    label: { ES: 'Aventura', EN: 'Adventure' },
    icon: 'shield',
    image: IMG_AVENTURA,
  },
]

/* ------------------------------------------------------------------ */
/* Experiencias                                                        */
/* ------------------------------------------------------------------ */

export const experiences: Experience[] = [
  {
    id: 'volcan-santa-ana',
    title: 'Volcán de Santa Ana',
    destination: 'Volcán de Santa Ana',
    category: 'volcanes',
    priceUsd: 45,
    rating: 4.9,
    reviews: 128,
    durationHours: 8,
    image: '/img/reels/thumbs/santa-ana.jpg',
    imageAlt: { ES: 'Laguna turquesa en el cráter del volcán de Santa Ana', EN: 'Turquoise lagoon inside the Santa Ana volcano crater' },
    tag: { ES: 'Más reservado', EN: 'Most booked' },
    maxPeople: 12,
    weekdays: [0, 3, 6],
    description: {
      ES: 'Sube al cráter del Ilamatepec, el volcán más alto de El Salvador, y asómate a su laguna de color turquesa. El sendero cruza fincas de café y bosque de pino dentro del Parque Nacional Los Volcanes.',
      EN: 'Hike to the crater of Ilamatepec, the highest volcano in El Salvador, and look down into its turquoise lagoon. The trail crosses coffee farms and pine forest inside Los Volcanes National Park.',
    },
    highlights: {
      ES: ['Mirador sobre la laguna del cráter', 'Vistas al lago de Coatepeque y al Izalco', 'Caminata moderada con guía local'],
      EN: ['Viewpoint over the crater lagoon', 'Views of Lake Coatepeque and Izalco', 'Moderate hike with a local guide'],
    },
  },
  {
    id: 'atardecer-el-tunco',
    title: 'Atardecer en El Tunco',
    destination: 'El Tunco',
    category: 'playas',
    priceUsd: 38,
    rating: 4.8,
    reviews: 94,
    durationHours: 4,
    image: '/img/reels/thumbs/el-tunco.jpg',
    imageAlt: { ES: 'La roca de El Tunco frente a la playa', EN: 'El Tunco rock off the beach' },
    tag: { ES: 'Favorito local', EN: 'Local favorite' },
    maxPeople: 15,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    description: {
      ES: 'Mira caer el sol detrás de la roca de El Tunco, uno de los rincones más fotografiados de la costa salvadoreña. Pasea por la playa de arena oscura, mira a los surfistas en las olas de la tarde y quédate al ambiente del pueblo.',
      EN: "Watch the sun go down behind El Tunco's famous rock, one of the most photographed spots on the Salvadoran coast. Walk the dark-sand beach, watch surfers catch the evening waves and stay for the village atmosphere.",
    },
    highlights: {
      ES: ['Atardecer frente a la roca', 'Paseo por la playa', 'Ambiente de pueblo surfero'],
      EN: ['Sunset by the rock', 'Beach walk', 'Surf-town atmosphere'],
    },
  },
  {
    id: 'ruta-de-las-flores',
    title: 'Ruta de las Flores',
    destination: 'Ruta de las Flores',
    category: 'cultura',
    priceUsd: 52,
    rating: 4.9,
    reviews: 76,
    durationHours: 10,
    image: '/img/experiences/ruta-de-las-flores.jpg',
    imageAlt: { ES: 'Iglesia de Juayúa, en la Ruta de las Flores', EN: 'Juayúa church on the Ruta de las Flores' },
    tag: { ES: 'Escapada', EN: 'Getaway' },
    maxPeople: 14,
    weekdays: [0, 6],
    description: {
      ES: 'Un día por los pueblos de colores de la Ruta de las Flores —Nahuizalco, Salcoatitán, Juayúa, Apaneca y Ataco— entre murales, mercados de artesanías, fincas de café y miradores de montaña.',
      EN: 'A day through the colorful towns of the Ruta de las Flores — Nahuizalco, Salcoatitán, Juayúa, Apaneca and Ataco — with murals, handicraft markets, coffee farms and mountain viewpoints.',
    },
    highlights: {
      ES: ['Cinco pueblos en un día', 'Murales de Ataco', 'Café de altura'],
      EN: ['Five towns in one day', 'Ataco murals', 'Highland coffee'],
    },
  },
  {
    id: 'kayak-coatepeque',
    title: 'Kayak en el Lago de Coatepeque',
    destination: 'Lago de Coatepeque',
    category: 'aventura',
    priceUsd: 42,
    rating: 4.7,
    reviews: 61,
    durationHours: 6,
    image: '/img/reels/thumbs/coatepeque.jpg',
    imageAlt: { ES: 'Vista del lago de Coatepeque', EN: 'View over Lake Coatepeque' },
    tag: { ES: 'Naturaleza', EN: 'Nature' },
    maxPeople: 10,
    weekdays: [0, 5, 6],
    description: {
      ES: 'Rema por el lago de Coatepeque, una caldera volcánica famosa por sus tonos de azul, con el volcán de Santa Ana en el horizonte. Apto para principiantes: el guía marca el ritmo.',
      EN: 'Paddle across Lake Coatepeque, a volcanic caldera known for its shifting shades of blue, with the Santa Ana volcano on the horizon. Beginner-friendly: your guide sets the pace.',
    },
    highlights: {
      ES: ['Lago de origen volcánico', 'Apto para principiantes', 'Grupo pequeño'],
      EN: ['Volcanic crater lake', 'Beginner-friendly', 'Small group'],
    },
  },
  {
    id: 'surf-el-zonte',
    title: 'Clases de surf en El Zonte',
    destination: 'El Zonte',
    category: 'playas',
    priceUsd: 35,
    rating: 4.8,
    reviews: 142,
    durationHours: 2,
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Playa de El Zonte al amanecer', EN: 'El Zonte beach at sunrise' },
    maxPeople: 8,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    description: {
      ES: 'Aprende a surfear en El Zonte, un pueblo de playa tranquilo con olas constantes. Clase para principiantes con instructor local: seguridad, remada y tus primeras puestas de pie.',
      EN: 'Learn to surf at El Zonte, a laid-back beach town with consistent waves. A beginner lesson with a local instructor: safety, paddling and your first pop-ups.',
    },
    highlights: {
      ES: ['Clase para principiantes', 'Instructor local', 'Grupos de hasta 8'],
      EN: ['Beginner lesson', 'Local instructor', 'Groups of up to 8'],
    },
  },
  {
    id: 'centro-historico-san-salvador',
    title: 'Centro histórico de San Salvador',
    destination: 'San Salvador',
    category: 'cultura',
    priceUsd: 28,
    rating: 4.6,
    reviews: 53,
    durationHours: 3,
    image: '/img/experiences/centro-historico.jpg',
    imageAlt: {
      ES: 'Palacio Nacional en el centro histórico de San Salvador',
      EN: 'National Palace in the historic center of San Salvador',
    },
    tag: { ES: 'Patrimonio', EN: 'Heritage' },
    maxPeople: 20,
    weekdays: [2, 4, 6],
    description: {
      ES: 'Recorre el centro histórico de San Salvador: el Palacio Nacional, la Catedral Metropolitana, el Teatro Nacional y la Plaza Libertad, con las historias que los rodean contadas por un guía local.',
      EN: "Walk San Salvador's historic center: the National Palace, the Metropolitan Cathedral, the National Theatre and Plaza Libertad, with the stories behind them told by a local guide.",
    },
    highlights: {
      ES: ['Palacio Nacional y Catedral', 'Teatro Nacional', 'Recorrido a pie'],
      EN: ['National Palace & Cathedral', 'National Theatre', 'Walking tour'],
    },
  },
  {
    id: 'bosque-nuboso',
    title: 'Bosque nuboso y senderos',
    destination: 'Santa Ana',
    category: 'aventura',
    priceUsd: 40,
    rating: 4.8,
    reviews: 47,
    durationHours: 5,
    image: '/img/experiences/bosque-montecristo.jpg',
    imageAlt: {
      ES: 'Interior del bosque nuboso de Montecristo',
      EN: 'Inside the Montecristo cloud forest',
    },
    tag: { ES: 'Nuevo', EN: 'New' },
    maxPeople: 12,
    weekdays: [0, 6],
    description: {
      ES: 'Senderos por el bosque nuboso del Parque Nacional Montecristo, al norte de Santa Ana, donde se unen El Salvador, Guatemala y Honduras. Robles y pinos cubiertos de musgo, orquídeas y bromelias.',
      EN: 'Trails through the cloud forest of Montecristo National Park, in northern Santa Ana, where El Salvador, Guatemala and Honduras meet. Moss-covered oaks and pines, orchids and bromeliads.',
    },
    highlights: {
      ES: ['Bosque nuboso', 'Punto trifinio', 'Flora de altura'],
      EN: ['Cloud forest', 'Tri-border region', 'Highland flora'],
    },
  },
  {
    id: 'suchitoto-colonial',
    title: 'Suchitoto colonial y lago Suchitlán',
    destination: 'Suchitoto',
    category: 'cultura',
    priceUsd: 48,
    rating: 4.7,
    reviews: 88,
    durationHours: 7,
    image: '/img/reels/thumbs/suchitoto.jpg',
    imageAlt: { ES: 'Calle empedrada de Suchitoto', EN: 'Cobblestone street in Suchitoto' },
    maxPeople: 16,
    weekdays: [0, 3, 6],
    description: {
      ES: 'Calles empedradas, la blanca iglesia de Santa Lucía y galerías de arte en Suchitoto, y después la vista sobre el lago Suchitlán.',
      EN: "Cobblestone streets, the white Santa Lucía church and art galleries in Suchitoto, followed by the view over Lake Suchitlán.",
    },
    highlights: {
      ES: ['Pueblo colonial', 'Iglesia de Santa Lucía', 'Lago Suchitlán'],
      EN: ['Colonial town', 'Santa Lucía church', 'Lake Suchitlán'],
    },
  },
  {
    id: 'surf-city-ruta',
    title: 'Surf City: ruta de playas',
    destination: 'Surf City',
    category: 'playas',
    priceUsd: 32,
    rating: 4.6,
    reviews: 71,
    durationHours: 5,
    image: '/img/experiences/surf-city-el-sunzal.jpg',
    imageAlt: { ES: 'Palmeras y ola en la playa El Sunzal, Surf City', EN: 'Palms and a breaking wave at El Sunzal beach, Surf City' },
    maxPeople: 18,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    description: {
      ES: 'Una ruta por Surf City con paradas en las playas de la costa de La Libertad, como El Tunco y El Sunzal, para ver sus rompientes y el litoral del Pacífico.',
      EN: "A coastal route through Surf City, stopping at beaches along La Libertad's coast such as El Tunco and El Sunzal to see the breaks and the Pacific shoreline.",
    },
    highlights: {
      ES: ['Varias playas en un día', 'Miradores de la costa', 'Ideal para fotos'],
      EN: ['Several beaches in one day', 'Coastal viewpoints', 'Great for photos'],
    },
  },
  {
    id: 'volcan-izalco',
    title: 'Volcán de Izalco desde Cerro Verde',
    destination: 'Santa Ana',
    category: 'volcanes',
    priceUsd: 50,
    rating: 4.7,
    reviews: 64,
    durationHours: 9,
    image: '/img/experiences/volcan-izalco.jpg',
    imageAlt: { ES: 'Volcán de Izalco visto desde el mirador de Cerro Verde', EN: 'Izalco volcano seen from the Cerro Verde viewpoint' },
    maxPeople: 12,
    weekdays: [0, 6],
    description: {
      ES: 'Desde Cerro Verde, la ruta baja y sube el cono del Izalco, al que llamaron «Faro del Pacífico» por sus erupciones constantes. Un recorrido exigente, con paisajes de roca volcánica y vistas amplias.',
      EN: "From Cerro Verde the trail descends and climbs the cone of Izalco, once called the 'Lighthouse of the Pacific' for its constant eruptions. A demanding route with volcanic rock landscapes and wide views.",
    },
    highlights: {
      ES: ['Cono volcánico joven', 'Ruta exigente', 'Vistas del Pacífico'],
      EN: ['Young volcanic cone', 'Challenging route', 'Pacific views'],
    },
  },
  {
    id: 'malecon-la-libertad',
    title: 'Malecón de La Libertad y mariscos',
    destination: 'La Libertad',
    category: 'cultura',
    priceUsd: 30,
    rating: 4.5,
    reviews: 39,
    durationHours: 4,
    image: '/img/experiences/malecon-la-libertad.jpg',
    imageAlt: { ES: 'Malecón y muelle del Puerto de La Libertad al atardecer', EN: 'Waterfront and pier of Puerto de La Libertad at sunset' },
    maxPeople: 20,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    description: {
      ES: 'Pasea por el malecón y el muelle de La Libertad, mira llegar las lanchas de los pescadores y prueba mariscos frescos en el mercado del puerto.',
      EN: 'Stroll the La Libertad waterfront and pier, watch the fishing boats come in and try fresh seafood at the harbor market.',
    },
    highlights: {
      ES: ['Muelle de pescadores', 'Mariscos frescos', 'Paseo tranquilo'],
      EN: ['Fishing pier', 'Fresh seafood', 'Easy stroll'],
    },
  },
]

/* ------------------------------------------------------------------ */
/* Filtrado                                                            */
/* ------------------------------------------------------------------ */

export type SearchCriteria = {
  /** Nombre del destino, o null para «cualquiera». */
  destination: string | null
  /** Fecha en formato AAAA-MM-DD, o null para «cualquier fecha». */
  date: string | null
  /** Número de viajeros. Siempre >= 1. */
  people: number
}

export const emptyCriteria: SearchCriteria = { destination: null, date: null, people: 2 }

/**
 * Convierte «AAAA-MM-DD» en una fecha LOCAL.
 *
 * `new Date('2026-09-15')` se interpreta como medianoche UTC, que en El
 * Salvador (UTC−6) cae en el día anterior y devolvería el día de la semana
 * equivocado. Por eso se construye componente a componente.
 */
export function parseLocalDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  // Rechaza fechas imposibles como 2026-02-31, que JS desbordaría a marzo.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Marcas diacríticas combinantes (U+0300–U+036F): lo que queda suelto al
 * descomponer «á» con normalize('NFD'). Se declara con escapes explícitos
 * para no depender de caracteres invisibles en el código fuente.
 */
const COMBINING_MARKS = /[̀-ͯ]/g

/**
 * Normaliza para comparar sin distinguir tildes ni mayúsculas.
 * Así «volcan» encuentra «Volcán» y «RUTA» encuentra «Ruta».
 */
export function normalize(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim()
}

/** ¿La experiencia sale ese día y admite ese grupo? */
export function matchesCriteria(experience: Experience, criteria: SearchCriteria): boolean {
  if (criteria.destination && normalize(experience.destination) !== normalize(criteria.destination)) {
    return false
  }

  if (criteria.people > experience.maxPeople) {
    return false
  }

  if (criteria.date) {
    const date = parseLocalDate(criteria.date)
    if (!date) return false
    if (!experience.weekdays.includes(date.getDay())) return false
  }

  return true
}

/** Aplica criterios de búsqueda y filtro de categoría a la vez. */
export function filterExperiences(
  criteria: SearchCriteria,
  category: CategoryId | null,
): Experience[] {
  return experiences.filter((experience) => {
    if (category && experience.category !== category) return false
    return matchesCriteria(experience, criteria)
  })
}

/** Destinos que coinciden con lo que el usuario va escribiendo. */
export function searchDestinations(term: string): Destination[] {
  const needle = normalize(term)
  if (!needle) return destinations
  return destinations.filter((destination) => normalize(destination.name).includes(needle))
}

export function hasActiveCriteria(criteria: SearchCriteria): boolean {
  return (
    criteria.destination !== null ||
    criteria.date !== null ||
    criteria.people !== emptyCriteria.people
  )
}
