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
  /**
   * Cómo se contrata:
   *   'online'  se reserva y se paga en la web (calendario + pasarela).
   *   'quote'   el precio es una REFERENCIA por persona y la reserva se
   *             confirma por WhatsApp o correo. Desde noviembre de 2026
   *             solo se venden en línea dos tours: «Amanecer en el Volcán
   *             de Santa Ana» y «Volcán de Santa Ana + Playa Los
   *             Almendros». El resto del catálogo queda para cotizar.
   */
  booking: 'online' | 'quote'
  /** Precio por persona en USD. `null` = «Precio a consultar» (solo con booking 'quote'). */
  priceUsd: number | null
  durationHours: number
  image: string
  imageAlt: Record<Locale, string>
  /**
   * Etiqueta dorada sobre la foto. Es PRUEBA SOCIAL: «Más reservado»,
   * «Favorito local», «Patrimonio»… lo que empuja a entrar en la ficha.
   *
   * NUNCA «Nuevo». Esa palabra ya la dice RatingBadge, en verde y con una
   * chispa, cuando la experiencia no tiene opiniones todavía. Dos
   * experiencias la llevaban aquí además: salían con «Nuevo» dos veces,
   * en dos colores y con dos significados distintos.
   */
  tag?: Record<Locale, string>
  /** Capacidad máxima del grupo. Filtra por número de viajeros. */
  maxPeople: number
  /** Días en que sale la experiencia. 0 = domingo … 6 = sábado. */
  weekdays: number[]
  /** Texto de la página de detalle y de la meta description. */
  description: Record<Locale, string>
  highlights: Record<Locale, string[]>
  /**
   * Retirada del catálogo público: no sale en la portada, los destinos, el
   * sitemap ni las búsquedas. Se conserva aquí porque puede haber reservas
   * y opiniones antiguas que la nombran (panel, área de cliente).
   */
  hidden?: boolean
  /** Tours con transporte privado incluido (recogida en hotel). Sustituye a «Guía local» en la tarjeta. */
  transportIncluded?: boolean
  /** Si está oculta, a qué experiencia lleva su ficha antigua. */
  replacedBy?: string
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
  { id: 'joya-de-ceren', name: 'Joya de Cerén', region: { ES: 'San Juan Opico, La Libertad', EN: 'San Juan Opico, La Libertad' } },
  { id: 'el-imposible', name: 'El Imposible', region: { ES: 'Ahuachapán', EN: 'Ahuachapán' } },
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

/** Todos los días de la semana: los tours nuevos salen a diario mientras no se diga otra cosa. */
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

export const experiences: Experience[] = [
  /*
   * TOURS (noviembre de 2026, documento «Tours y precios»). Son los únicos
   * que se reservan y pagan en línea. Precio POR PERSONA, grupos de hasta 7,
   * transporte incluido. Duración y días de salida son una propuesta que
   * falta confirmar con el cliente; la hora de recogida del amanecer (1:30
   * a. m., de El Tunco a hoteles de San Salvador) sí está confirmada.
   * Van primero en la lista: es el orden «recomendado» del catálogo.
   */
  {
    id: 'amanecer-volcan-santa-ana',
    transportIncluded: true,
    title: 'Amanecer en el Volcán de Santa Ana',
    name: { ES: 'Amanecer en el Volcán de Santa Ana', EN: 'Santa Ana Volcano Sunrise' },
    destination: 'Volcán de Santa Ana',
    category: 'volcanes',
    booking: 'online',
    priceUsd: 85,
    durationHours: 10,
    image: '/img/reels/santa-ana.jpg',
    imageAlt: { ES: 'Laguna turquesa en el cráter del volcán de Santa Ana', EN: 'Turquoise lagoon inside the Santa Ana volcano crater' },
    tag: { ES: 'Al amanecer', EN: 'At sunrise' },
    maxPeople: 7,
    weekdays: EVERY_DAY,
    description: {
      ES: 'Sube al cráter del Ilamatepec, el volcán más alto de El Salvador, y ve salir el sol sobre su laguna turquesa. Te recogemos de madrugada —desde la 1:30 a. m. en El Tunco y después en hoteles de San Salvador— y el transporte va incluido de ida y vuelta.',
      EN: 'Climb to the crater of Ilamatepec, the highest volcano in El Salvador, and watch the sun rise over its turquoise lagoon. We pick you up before dawn —from 1:30 a.m. in El Tunco and then at hotels in San Salvador— and round-trip transport is included.',
    },
    highlights: {
      ES: ['Amanecer en el cráter', 'Recogida desde la 1:30 a. m. en El Tunco y San Salvador', 'Transporte incluido · hasta 7 personas'],
      EN: ['Sunrise at the crater', 'Pickup from 1:30 a.m. in El Tunco and San Salvador', 'Transport included · up to 7 people'],
    },
  },
  {
    id: 'santa-ana-playa-los-almendros',
    transportIncluded: true,
    title: 'Volcán de Santa Ana + Playa Los Almendros',
    name: { ES: 'Volcán de Santa Ana + Playa Los Almendros', EN: 'Santa Ana Volcano + Los Almendros Beach' },
    destination: 'Volcán de Santa Ana',
    category: 'volcanes',
    booking: 'online',
    priceUsd: 150,
    durationHours: 12,
    image: '/img/categoria-volcanes.jpg',
    imageAlt: { ES: 'Complejo Los Volcanes: Izalco, Cerro Verde y Santa Ana', EN: 'Los Volcanes complex: Izalco, Cerro Verde and Santa Ana' },
    tag: { ES: 'Volcán y playa', EN: 'Volcano & beach' },
    maxPeople: 7,
    weekdays: EVERY_DAY,
    description: {
      ES: 'Del volcán al mar en un solo día: por la mañana, caminata al cráter del Volcán de Santa Ana; por la tarde, picnic frente al Pacífico en la playa Los Almendros. Transporte incluido durante todo el día.',
      EN: 'From the volcano to the sea in a single day: in the morning, a hike to the Santa Ana volcano crater; in the afternoon, a picnic by the Pacific at Los Almendros beach. Transport included all day.',
    },
    highlights: {
      ES: ['Caminata al cráter del Santa Ana', 'Picnic en la playa Los Almendros', 'Transporte incluido · hasta 7 personas'],
      EN: ['Hike to the Santa Ana crater', 'Picnic at Los Almendros beach', 'Transport included · up to 7 people'],
    },
  },
  {
    id: 'santa-ana-coatepeque-jetsky',
    transportIncluded: true,
    title: 'Volcán de Santa Ana + Lago de Coatepeque en jetsky',
    name: { ES: 'Volcán de Santa Ana + Lago de Coatepeque en jetsky', EN: 'Santa Ana Volcano + Lake Coatepeque by Jet Ski' },
    destination: 'Lago de Coatepeque',
    category: 'aventura',
    // Sin precio en el documento: se publica «a consultar» y se cotiza.
    booking: 'quote',
    priceUsd: null,
    durationHours: 10,
    image: '/img/reels/coatepeque.jpg',
    imageAlt: { ES: 'Lago de Coatepeque visto desde lo alto de la caldera', EN: 'Lake Coatepeque seen from the caldera rim' },
    tag: { ES: 'Aventura', EN: 'Adventure' },
    maxPeople: 7,
    weekdays: EVERY_DAY,
    description: {
      ES: 'Caminata al cráter del Volcán de Santa Ana y, después, el Lago de Coatepeque desde el agua: un paseo en jetsky por el lago dentro de la caldera. Transporte incluido. Escríbenos y te damos el precio para tu grupo.',
      EN: 'A hike to the Santa Ana volcano crater followed by Lake Coatepeque from the water: a jet ski ride on the lake inside the caldera. Transport included. Write to us and we will quote your group.',
    },
    highlights: {
      ES: ['Caminata al cráter del Santa Ana', 'Jetsky en el Lago de Coatepeque', 'Transporte incluido · hasta 7 personas'],
      EN: ['Hike to the Santa Ana crater', 'Jet ski on Lake Coatepeque', 'Transport included · up to 7 people'],
    },
  },
  {
    id: 'ruta-de-las-flores-4x4',
    transportIncluded: true,
    title: 'Ruta de las Flores en 4x4',
    name: { ES: 'Ruta de las Flores en 4x4', EN: 'Ruta de las Flores 4x4 Tour' },
    destination: 'Ruta de las Flores',
    category: 'cultura',
    booking: 'quote',
    priceUsd: 175,
    durationHours: 10,
    image: '/img/experiences/ruta-de-las-flores.jpg',
    imageAlt: { ES: 'Pueblo de la Ruta de las Flores entre montañas', EN: 'A Ruta de las Flores town among the mountains' },
    tag: { ES: 'Café y cascadas', EN: 'Coffee & waterfalls' },
    maxPeople: 7,
    weekdays: EVERY_DAY,
    description: {
      ES: 'La Ruta de las Flores en 4x4: las calles de murales de Concepción de Ataco, un café en Albania Café, en Apaneca, y las Cascadas de San Juan. Transporte incluido durante todo el recorrido.',
      EN: 'The Ruta de las Flores by 4x4: the mural-lined streets of Concepción de Ataco, a coffee at Albania Café in Apaneca and the San Juan waterfalls. Transport included for the whole route.',
    },
    highlights: {
      ES: ['Ruta en 4x4 por Ataco', 'Albania Café, en Apaneca', 'Cascadas de San Juan'],
      EN: ['4x4 route through Ataco', 'Albania Café in Apaneca', 'San Juan waterfalls'],
    },
  },
  {
    id: 'boqueron-centro-historico',
    transportIncluded: true,
    title: 'El Boquerón + Tobogán Picnic Steak House + Centro Histórico',
    name: { ES: 'El Boquerón + Centro Histórico', EN: 'El Boquerón + Historic Center' },
    destination: 'San Salvador',
    category: 'volcanes',
    booking: 'quote',
    priceUsd: 70,
    durationHours: 7,
    image: '/img/experiences/boqueron-crater.jpg',
    imageAlt: { ES: 'Cráter de El Boquerón, en el volcán de San Salvador', EN: 'El Boquerón crater on the San Salvador volcano' },
    tag: { ES: 'Cerca de la capital', EN: 'Near the capital' },
    maxPeople: 7,
    weekdays: EVERY_DAY,
    description: {
      ES: 'Asómate al cráter del volcán de San Salvador en el Parque Nacional El Boquerón, haz una parada en Tobogán Picnic Steak House y termina paseando por el Centro Histórico de la capital: Catedral, Palacio Nacional y Teatro Nacional. Transporte incluido.',
      EN: 'Look into the crater of the San Salvador volcano at El Boquerón National Park, stop at Tobogán Picnic Steak House and finish with a walk through the capital’s Historic Center: Cathedral, National Palace and National Theatre. Transport included.',
    },
    highlights: {
      ES: ['Cráter de El Boquerón', 'Parada en Tobogán Picnic Steak House', 'Centro Histórico de San Salvador'],
      EN: ['El Boquerón crater', 'Stop at Tobogán Picnic Steak House', 'San Salvador Historic Center'],
    },
  },
  {
    id: 'centro-historico-puerta-del-diablo',
    transportIncluded: true,
    title: 'Centro Histórico + Puerta del Diablo',
    name: { ES: 'Centro Histórico + Puerta del Diablo', EN: 'Historic Center + Puerta del Diablo' },
    destination: 'Puerta del Diablo',
    category: 'cultura',
    booking: 'quote',
    priceUsd: 65,
    durationHours: 6,
    image: '/img/experiences/puerta-del-diablo.jpg',
    imageAlt: { ES: 'Las peñas de la Puerta del Diablo, Panchimalco', EN: 'The Puerta del Diablo rocks, Panchimalco' },
    tag: { ES: 'Ciudad y miradores', EN: 'City & viewpoints' },
    maxPeople: 7,
    weekdays: EVERY_DAY,
    description: {
      ES: 'La capital en un día: recorrido por el Centro Histórico de San Salvador y subida a la Puerta del Diablo, en Panchimalco, con vistas a la ciudad, al lago de Ilopango y al Pacífico. Transporte incluido.',
      EN: 'The capital in one day: a walk through the Historic Center of San Salvador and a trip up to Puerta del Diablo, in Panchimalco, with views of the city, Lake Ilopango and the Pacific. Transport included.',
    },
    highlights: {
      ES: ['Centro Histórico de San Salvador', 'Miradores de la Puerta del Diablo', 'Transporte incluido · hasta 7 personas'],
      EN: ['San Salvador Historic Center', 'Puerta del Diablo viewpoints', 'Transport included · up to 7 people'],
    },
  },

  /*
   * EXPERIENCIAS PARA COTIZAR. El precio es una referencia por persona; la
   * reserva se confirma por WhatsApp o correo. Las marcadas `hidden` se
   * parecían a un tour nuevo y salieron del catálogo público.
   */
  {
    id: 'volcan-santa-ana',
    hidden: true,
    replacedBy: 'amanecer-volcan-santa-ana',
    title: 'Volcán de Santa Ana',
    name: { ES: 'Volcán de Santa Ana', EN: 'Santa Ana Volcano Hike' },
    destination: 'Volcán de Santa Ana',
    category: 'volcanes',
    booking: 'quote',
    priceUsd: 45,
    durationHours: 8,
    image: '/img/reels/thumbs/santa-ana.jpg',
    imageAlt: { ES: 'Laguna turquesa en el cráter del volcán de Santa Ana', EN: 'Turquoise lagoon inside the Santa Ana volcano crater' },
    tag: { ES: 'Más reservado', EN: 'Most booked' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 38,
    durationHours: 4,
    image: '/img/reels/thumbs/el-tunco.jpg',
    imageAlt: { ES: 'La roca de El Tunco frente a la playa', EN: 'El Tunco rock off the beach' },
    tag: { ES: 'Favorito local', EN: 'Local favorite' },
    maxPeople: 7,
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
    hidden: true,
    replacedBy: 'ruta-de-las-flores-4x4',
    title: 'Ruta de las Flores',
    name: { ES: 'Ruta de las Flores', EN: 'Ruta de las Flores Day Trip' },
    destination: 'Ruta de las Flores',
    category: 'cultura',
    booking: 'quote',
    priceUsd: 52,
    durationHours: 10,
    image: '/img/experiences/ruta-de-las-flores.jpg',
    imageAlt: { ES: 'Iglesia de Juayúa, en la Ruta de las Flores', EN: 'Juayúa church on the Ruta de las Flores' },
    tag: { ES: 'Escapada', EN: 'Getaway' },
    maxPeople: 7,
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
    hidden: true,
    replacedBy: 'santa-ana-coatepeque-jetsky',
    title: 'Kayak en el Lago de Coatepeque',
    name: { ES: 'Kayak en el Lago de Coatepeque', EN: 'Kayaking on Lake Coatepeque' },
    destination: 'Lago de Coatepeque',
    category: 'aventura',
    booking: 'quote',
    priceUsd: 42,
    durationHours: 6,
    image: '/img/reels/thumbs/coatepeque.jpg',
    imageAlt: { ES: 'Vista del lago de Coatepeque', EN: 'View over Lake Coatepeque' },
    tag: { ES: 'Naturaleza', EN: 'Nature' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 35,
    durationHours: 2,
    image: '/img/experiences/surf-el-zonte.jpg',
    // La foto es de banco (Pixabay) y no está tomada en El Zonte, así que
    // el texto describe la escena sin nombrar la playa. Ver lib/credits.ts.
    imageAlt: {
      ES: 'Surfistas con sus tablas entrando al mar al atardecer',
      EN: 'Surfers carrying their boards into the sea at sunset',
    },
    maxPeople: 7,
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
    hidden: true,
    replacedBy: 'boqueron-centro-historico',
    title: 'Centro histórico de San Salvador',
    name: { ES: 'Centro histórico de San Salvador', EN: 'San Salvador Historic Center' },
    destination: 'San Salvador',
    category: 'cultura',
    booking: 'quote',
    priceUsd: 28,
    durationHours: 3,
    image: '/img/experiences/centro-historico.jpg',
    imageAlt: {
      ES: 'Palacio Nacional en el centro histórico de San Salvador',
      EN: 'National Palace in the historic center of San Salvador',
    },
    tag: { ES: 'Patrimonio', EN: 'Heritage' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 40,
    durationHours: 5,
    image: '/img/experiences/bosque-montecristo.jpg',
    imageAlt: {
      ES: 'Interior del bosque nuboso de Montecristo',
      EN: 'Inside the Montecristo cloud forest',
    },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 48,
    durationHours: 7,
    image: '/img/reels/thumbs/suchitoto.jpg',
    imageAlt: { ES: 'Calle empedrada de Suchitoto', EN: 'Cobblestone street in Suchitoto' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 32,
    durationHours: 5,
    image: '/img/experiences/surf-city-el-sunzal.jpg',
    imageAlt: { ES: 'Palmeras y ola en la playa El Sunzal, Surf City', EN: 'Palms and a breaking wave at El Sunzal beach, Surf City' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 50,
    durationHours: 9,
    image: '/img/experiences/volcan-izalco.jpg',
    imageAlt: { ES: 'Volcán de Izalco visto desde el mirador de Cerro Verde', EN: 'Izalco volcano seen from the Cerro Verde viewpoint' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 30,
    durationHours: 4,
    image: '/img/experiences/malecon-la-libertad.jpg',
    imageAlt: { ES: 'Malecón y muelle del Puerto de La Libertad al atardecer', EN: 'Waterfront and pier of Puerto de La Libertad at sunset' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 35,
    durationHours: 5,
    image: '/img/experiences/cascadas-tamanique.jpg',
    imageAlt: {
      ES: 'Cascada de Tamanique cayendo sobre una poza entre paredes de roca',
      EN: 'Tamanique waterfall dropping into a pool between rock walls',
    },
    maxPeople: 7,
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
    hidden: true,
    replacedBy: 'centro-historico-puerta-del-diablo',
    title: 'Parque Natural Puerta del Diablo',
    name: { ES: 'Parque Natural Puerta del Diablo', EN: 'Puerta del Diablo Natural Park' },
    destination: 'Puerta del Diablo',
    category: 'aventura',
    booking: 'quote',
    priceUsd: 30,
    durationHours: 4,
    image: '/img/experiences/puerta-del-diablo.jpg',
    imageAlt: {
      ES: 'Peñas de la Puerta del Diablo sobre la cordillera verde de Panchimalco',
      EN: 'The Puerta del Diablo rocks above the green ridge of Panchimalco',
    },
    tag: { ES: 'Miradores', EN: 'Viewpoints' },
    maxPeople: 7,
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
    booking: 'quote',
    priceUsd: 55,
    durationHours: 7,
    image: '/img/experiences/volcan-conchagua.jpg',
    imageAlt: {
      ES: 'Golfo de Fonseca y sus islas vistos desde el volcán de Conchagua',
      EN: 'The Gulf of Fonseca and its islands seen from Conchagua volcano',
    },
    tag: { ES: 'Amanecer', EN: 'Sunrise' },
    maxPeople: 7,
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
  {
    id: 'joya-de-ceren-san-andres',
    title: 'Joya de Cerén y San Andrés',
    name: { ES: 'Joya de Cerén y San Andrés', EN: 'Joya de Cerén and San Andrés' },
    destination: 'Joya de Cerén',
    category: 'cultura',
    booking: 'quote',
    // Sin precio de referencia todavía: se muestra «Precio a consultar».
    priceUsd: null,
    durationHours: 5,
    image: '/img/experiences/joya-de-ceren.jpg',
    imageAlt: {
      ES: 'Estructura de adobe de la aldea maya de Joya de Cerén',
      EN: 'Adobe structure of the Maya village of Joya de Cerén',
    },
    tag: { ES: 'Patrimonio UNESCO', EN: 'UNESCO heritage' },
    maxPeople: 7,
    // El parque arqueológico cierra los lunes.
    weekdays: [0, 2, 3, 4, 5, 6],
    description: {
      ES: 'Una aldea maya que la ceniza de un volcán cubrió hacia el año 600 y conservó casi intacta: casas, bodegas y un temazcal tal como los dejaron sus habitantes. Patrimonio de la Humanidad desde 1993. La visita sigue en San Andrés, el centro ceremonial del mismo valle.',
      EN: 'A Maya village that volcanic ash buried around the year 600 and kept almost intact: houses, storerooms and a sweat bath just as their inhabitants left them. A World Heritage Site since 1993. The visit continues at San Andrés, the ceremonial center of the same valley.',
    },
    highlights: {
      ES: ['Patrimonio de la Humanidad', 'Aldea maya bajo la ceniza', 'Centro ceremonial de San Andrés'],
      EN: ['World Heritage Site', 'Maya village under the ash', 'San Andrés ceremonial center'],
    },
  },
  {
    id: 'el-imposible-senderos',
    title: 'Parque Nacional El Imposible',
    name: { ES: 'Parque Nacional El Imposible', EN: 'El Imposible National Park' },
    destination: 'El Imposible',
    category: 'aventura',
    booking: 'quote',
    priceUsd: null,
    durationHours: 10,
    image: '/img/experiences/el-imposible.jpg',
    imageAlt: {
      ES: 'Montañas cubiertas de bosque vistas desde un mirador de El Imposible',
      EN: 'Forest-covered mountains seen from a viewpoint in El Imposible',
    },
    maxPeople: 7,
    weekdays: [0, 6],
    description: {
      ES: 'Uno de los bosques más grandes que le quedan a El Salvador, en las montañas de Ahuachapán. Senderos entre árboles altos, miradores sobre los cañones y pozas de río para refrescarse. Su nombre viene de un paso de montaña que antes era casi imposible de cruzar.',
      EN: 'One of the largest forests left in El Salvador, in the mountains of Ahuachapán. Trails among tall trees, viewpoints over the canyons and river pools to cool off. Its name comes from a mountain pass that was once almost impossible to cross.',
    },
    highlights: {
      ES: ['Bosque protegido', 'Miradores sobre los cañones', 'Pozas de río'],
      EN: ['Protected forest', 'Viewpoints over the canyons', 'River pools'],
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

/**
 * Catálogo PÚBLICO: lo que se lista en la portada, los destinos, el sitemap
 * y las búsquedas. `experiences` sigue teniendo también las ocultas, para
 * nombrar reservas y opiniones antiguas.
 */
export const catalog: Experience[] = experiences.filter((experience) => !experience.hidden)

/** ¿Se reserva y paga en línea? Si no, se cotiza por WhatsApp o correo. */
export function isBookableOnline(experience: Pick<Experience, 'booking' | 'priceUsd'>): experience is Pick<Experience, 'booking'> & { priceUsd: number } {
  return experience.booking === 'online' && experience.priceUsd !== null
}

/** Aplica criterios de búsqueda y filtro de categoría a la vez. */
export function filterExperiences(
  criteria: SearchCriteria,
  category: CategoryId | null,
): Experience[] {
  return catalog.filter((experience) => {
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
