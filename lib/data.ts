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
 * Las dos URL de Unsplash que había aquí devolvían 404, que es por lo que
 * esas dos categorías se veían vacías. Se sustituyen por fondos propios en
 * la paleta de la marca, servidos desde /public/img.
 *
 * PARA PONER FOTOGRAFÍAS REALES: copie los archivos a /public/img y cambie
 * únicamente estas dos constantes. No hay que tocar nada más.
 *
 *   const IMG_CULTURA  = '/img/categoria-cultura.jpg'
 *   const IMG_AVENTURA = '/img/categoria-aventura.jpg'
 *
 * Cada constante alimenta dos sitios: la tarjeta de la categoría y una
 * experiencia de esa categoría.
 */
const IMG_CULTURA = '/img/categoria-cultura.svg'
const IMG_AVENTURA = '/img/categoria-aventura.svg'

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
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'volcanes',
    label: { ES: 'Volcanes', EN: 'Volcanoes' },
    icon: 'compass',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
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
    image: 'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Cráter del volcán de Santa Ana', EN: 'Santa Ana volcano crater' },
    tag: { ES: 'Más reservado', EN: 'Most booked' },
    maxPeople: 12,
    weekdays: [0, 3, 6],
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
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Atardecer en la playa El Tunco', EN: 'Sunset at El Tunco beach' },
    tag: { ES: 'Favorito local', EN: 'Local favorite' },
    maxPeople: 15,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
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
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Paisaje de la Ruta de las Flores', EN: 'Ruta de las Flores landscape' },
    tag: { ES: 'Escapada', EN: 'Getaway' },
    maxPeople: 14,
    weekdays: [0, 6],
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
    image: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Lago de Coatepeque visto desde la orilla', EN: 'Coatepeque lake from the shore' },
    tag: { ES: 'Naturaleza', EN: 'Nature' },
    maxPeople: 10,
    weekdays: [0, 5, 6],
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
    image: IMG_CULTURA,
    imageAlt: {
      ES: 'Comparsa cultural frente al Monumento al Divino Salvador del Mundo',
      EN: 'Cultural parade by the Divino Salvador del Mundo monument',
    },
    tag: { ES: 'Patrimonio', EN: 'Heritage' },
    maxPeople: 20,
    weekdays: [2, 4, 6],
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
    image: IMG_AVENTURA,
    imageAlt: {
      ES: 'Sendero elevado entre pinos en el bosque nuboso',
      EN: 'Elevated boardwalk through cloud forest pines',
    },
    tag: { ES: 'Nuevo', EN: 'New' },
    maxPeople: 12,
    weekdays: [0, 6],
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
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Vista del lago Suchitlán', EN: 'View of Suchitlán lake' },
    maxPeople: 16,
    weekdays: [0, 3, 6],
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
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Playa del Pacífico salvadoreño', EN: 'Salvadoran Pacific beach' },
    maxPeople: 18,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
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
    image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Cordillera volcánica salvadoreña', EN: 'Salvadoran volcanic range' },
    maxPeople: 12,
    weekdays: [0, 6],
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
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=85',
    imageAlt: { ES: 'Costa de La Libertad al atardecer', EN: 'La Libertad coast at sunset' },
    maxPeople: 20,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
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
