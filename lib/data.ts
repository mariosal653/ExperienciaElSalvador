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
  /**
   * Nombre canónico en español. Es el que se guarda en la reserva, las
   * opiniones y el panel: no cambia con el idioma de la interfaz.
   */
  title: string
  /** Nombre visible, traducido. Usar `experienceName()` en la interfaz. */
  name: Record<Locale, string>
  /** Debe coincidir con el `name` de un destino. */
  destination: string
  category: CategoryId
  priceUsd: number
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
  { id: 'tamanique', name: 'Tamanique', region: { ES: 'La Libertad', EN: 'La Libertad' } },
  { id: 'puerta-del-diablo', name: 'Puerta del Diablo', region: { ES: 'Panchimalco, San Salvador', EN: 'Panchimalco, San Salvador' } },
  { id: 'volcan-de-conchagua', name: 'Volcán de Conchagua', region: { ES: 'La Unión', EN: 'La Unión' } },
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
    name: { ES: 'Volcán de Santa Ana', EN: 'Santa Ana Volcano Hike' },
    destination: 'Volcán de Santa Ana',
    category: 'volcanes',
    priceUsd: 45,
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
    name: { ES: 'Atardecer en El Tunco', EN: 'Sunset at El Tunco' },
    destination: 'El Tunco',
    category: 'playas',
    priceUsd: 38,
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
    name: { ES: 'Ruta de las Flores', EN: 'Ruta de las Flores Day Trip' },
    destination: 'Ruta de las Flores',
    category: 'cultura',
    priceUsd: 52,
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
    name: { ES: 'Kayak en el Lago de Coatepeque', EN: 'Kayaking on Lake Coatepeque' },
    destination: 'Lago de Coatepeque',
    category: 'aventura',
    priceUsd: 42,
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
    name: { ES: 'Clases de surf en El Zonte', EN: 'Surf Lessons in El Zonte' },
    destination: 'El Zonte',
    category: 'playas',
    priceUsd: 35,
    durationHours: 2,
    image: '/img/experiences/surf-el-zonte.jpg',
    // La foto es de banco (Pixabay) y no está tomada en El Zonte, así que
    // el texto describe la escena sin nombrar la playa. Ver lib/credits.ts.
    imageAlt: {
      ES: 'Surfistas con sus tablas entrando al mar al atardecer',
      EN: 'Surfers carrying their boards into the sea at sunset',
    },
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
    name: { ES: 'Centro histórico de San Salvador', EN: 'San Salvador Historic Center' },
    destination: 'San Salvador',
    category: 'cultura',
    priceUsd: 28,
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
    name: { ES: 'Bosque nuboso y senderos', EN: 'Cloud Forest Trails' },
    destination: 'Santa Ana',
    category: 'aventura',
    priceUsd: 40,
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
    name: { ES: 'Suchitoto colonial y lago Suchitlán', EN: 'Colonial Suchitoto & Lake Suchitlán' },
    destination: 'Suchitoto',
    category: 'cultura',
    priceUsd: 48,
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
    name: { ES: 'Surf City: ruta de playas', EN: 'Surf City Beach Route' },
    destination: 'Surf City',
    category: 'playas',
    priceUsd: 32,
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
    name: { ES: 'Volcán de Izalco desde Cerro Verde', EN: 'Izalco Volcano from Cerro Verde' },
    destination: 'Santa Ana',
    category: 'volcanes',
    priceUsd: 50,
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
    name: { ES: 'Malecón de La Libertad y mariscos', EN: 'La Libertad Waterfront & Seafood' },
    destination: 'La Libertad',
    category: 'cultura',
    priceUsd: 30,
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
  {
    id: 'cascadas-tamanique',
    title: 'Cascadas de Tamanique',
    name: { ES: 'Cascadas de Tamanique', EN: 'Tamanique Waterfalls Hike' },
    destination: 'Tamanique',
    category: 'aventura',
    priceUsd: 35,
    durationHours: 5,
    image: '/img/experiences/cascadas-tamanique.jpg',
    imageAlt: {
      ES: 'Cascada de Tamanique cayendo sobre una poza entre paredes de roca',
      EN: 'Tamanique waterfall dropping into a pool between rock walls',
    },
    tag: { ES: 'Nuevo', EN: 'New' },
    maxPeople: 10,
    weekdays: [0, 3, 5, 6],
    description: {
      ES: 'Baja desde el pueblo de Tamanique, en la cordillera del Bálsamo, por un sendero de unos 2 km hasta las cascadas escondidas en un cañón de roca. Nada en sus pozas de agua fresca y, si te animas, salta desde las rocas con el guía. A 35 minutos de El Tunco.',
      EN: 'Hike down from the town of Tamanique, in the Bálsamo mountain range, along a trail of about 2 km to waterfalls hidden in a rock canyon. Swim in their cool pools and, if you dare, jump from the rocks with your guide. 35 minutes from El Tunco.',
    },
    highlights: {
      ES: ['Cascadas y pozas para nadar', 'Saltos opcionales con guía', 'Vista al mar desde la cordillera'],
      EN: ['Waterfalls and swimming pools', 'Optional jumps with a guide', 'Ocean views from the ridge'],
    },
  },
  {
    id: 'puerta-del-diablo',
    title: 'Parque Natural Puerta del Diablo',
    name: { ES: 'Parque Natural Puerta del Diablo', EN: 'Puerta del Diablo Natural Park' },
    destination: 'Puerta del Diablo',
    category: 'aventura',
    priceUsd: 30,
    durationHours: 4,
    image: '/img/experiences/puerta-del-diablo.jpg',
    imageAlt: {
      ES: 'Peña de la Puerta del Diablo entre montañas y neblina',
      EN: 'Puerta del Diablo rock among mountains and mist',
    },
    tag: { ES: 'Miradores', EN: 'Viewpoints' },
    maxPeople: 14,
    weekdays: [0, 3, 6],
    description: {
      ES: 'Sube a las peñas de la Puerta del Diablo, dos enormes rocas partidas que dan nombre a una leyenda, en Panchimalco, a unos 40 minutos de San Salvador. Desde la cima se ven la capital, el lago de Ilopango, el volcán de San Vicente y el océano Pacífico. Cierra con una parada en el pueblo de Panchimalco.',
      EN: "Climb the rocks of the Puerta del Diablo (\"Devil's Door\"), two huge split boulders at the heart of a local legend, in Panchimalco, about 40 minutes from San Salvador. From the top you can see the capital, Lake Ilopango, the San Vicente volcano and the Pacific Ocean. It ends with a stop in the town of Panchimalco.",
    },
    highlights: {
      ES: ['Vistas al lago de Ilopango y al Pacífico', 'Subida corta a las peñas', 'Parada en Panchimalco'],
      EN: ['Views of Lake Ilopango and the Pacific', 'Short climb to the rocks', 'Stop in Panchimalco'],
    },
  },
  {
    id: 'volcan-conchagua',
    title: 'Amanecer en el volcán de Conchagua',
    name: { ES: 'Amanecer en el volcán de Conchagua', EN: 'Sunrise on Conchagua Volcano' },
    destination: 'Volcán de Conchagua',
    category: 'volcanes',
    priceUsd: 55,
    durationHours: 7,
    image: '/img/experiences/volcan-conchagua.jpg',
    imageAlt: {
      ES: 'Golfo de Fonseca y sus islas vistos desde el volcán de Conchagua',
      EN: 'The Gulf of Fonseca and its islands seen from Conchagua volcano',
    },
    tag: { ES: 'Amanecer', EN: 'Sunrise' },
    maxPeople: 12,
    weekdays: [0, 6],
    description: {
      ES: 'Sube en 4x4 al mirador Espíritu de la Montaña, a más de 1 200 metros sobre el Golfo de Fonseca, y mira salir el sol sobre las montañas de Honduras y Nicaragua. Abajo, las islas Meanguera, Conchagüita y Zacatillo. Desayuno en la montaña y caminata por el Parque Natural Conchagua.',
      EN: 'Ride a 4x4 up to the Espíritu de la Montaña viewpoint, more than 1,200 meters above the Gulf of Fonseca, and watch the sun rise over the mountains of Honduras and Nicaragua. Below lie the islands of Meanguera, Conchagüita and Zacatillo. Breakfast on the mountain and a walk through Conchagua Natural Park.',
    },
    highlights: {
      ES: ['Amanecer sobre el Golfo de Fonseca', 'Tres países a la vista', 'Subida en 4x4'],
      EN: ['Sunrise over the Gulf of Fonseca', 'Three countries in view', '4x4 ride to the top'],
    },
  },
]

/** Nombre de la experiencia en el idioma de la interfaz. */
export function experienceName(experience: Pick<Experience, 'name'>, lang: Locale): string {
  return experience.name[lang]
}

/** Busca el nombre traducido a partir del id; útil para reservas y opiniones. */
export function experienceNameById(id: string | null | undefined, lang: Locale): string | null {
  if (!id) return null
  const experience = experiences.find((item) => item.id === id)
  return experience ? experience.name[lang] : null
}

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
