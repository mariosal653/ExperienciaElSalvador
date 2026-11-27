/**
 * Guías de inspiración: itinerarios cortos que enlazan experiencias del
 * catálogo y el Personal Driver. Cada una tiene su página en /guias/<slug>.
 *
 * Solo enlazan experiencias VISIBLES del catálogo (lo comprueba
 * tests/guides.test.ts). El precio y la reserva se leen siempre del
 * catálogo: aquí no se repite ningún precio, para que no se desfasen.
 */

import type { Locale } from './data'
import { MIN_HOURS } from './services'

type Text = Record<Locale, string>

export type GuideStop = {
  /** «Día 1», «Sábado»… */
  label: Text
  title: Text
  text: Text
  /** Experiencias del catálogo que cubren esta parada, en orden. */
  experienceIds?: string[]
  /** Servicio (id = slug de /servicios/<slug>) que cubre esta parada. */
  serviceId?: string
}

export type Guide = {
  slug: string
  title: Text
  /** Una línea para la tarjeta del inicio y la descripción SEO. */
  summary: Text
  /** «3 días», «Fin de semana»… */
  length: Text
  image: { src: string; alt: Text }
  intro: Text
  stops: GuideStop[]
  tip: Text
}

export const guides: Guide[] = [
  {
    slug: 'el-salvador-en-3-dias',
    title: { ES: 'El Salvador en 3 días', EN: 'El Salvador in 3 days' },
    summary: {
      ES: 'Volcán, capital y costa: lo esencial del país en un viaje corto.',
      EN: 'Volcano, capital and coast: the essentials of the country on a short trip.',
    },
    length: { ES: '3 días', EN: '3 days' },
    image: {
      src: '/img/reels/santa-ana.jpg',
      alt: { ES: 'Laguna del cráter del Volcán de Santa Ana', EN: 'Crater lagoon of the Santa Ana Volcano' },
    },
    intro: {
      ES: 'Si solo tienes tres días, esta ruta te lleva a los tres paisajes que definen El Salvador: un volcán activo, la capital y el Pacífico. Cada día es independiente, así que puedes cambiar el orden según tu vuelo.',
      EN: 'If you only have three days, this route takes you to the three landscapes that define El Salvador: an active volcano, the capital and the Pacific. Each day stands on its own, so you can switch the order around your flight.',
    },
    stops: [
      {
        label: { ES: 'Día 1', EN: 'Day 1' },
        title: { ES: 'Amanecer en el Volcán de Santa Ana', EN: 'Sunrise at the Santa Ana Volcano' },
        text: {
          ES: 'El volcán más alto del país y su laguna turquesa dentro del cráter. Se sale de madrugada para llegar con la mejor luz y el sendero más fresco.',
          EN: 'The highest volcano in the country, with its turquoise lagoon inside the crater. You leave before dawn to arrive with the best light and the coolest trail.',
        },
        experienceIds: ['amanecer-volcan-santa-ana'],
      },
      {
        label: { ES: 'Día 2', EN: 'Day 2' },
        title: { ES: 'El Boquerón y el Centro Histórico', EN: 'El Boquerón and the Historic Center' },
        text: {
          ES: 'Por la mañana, el cráter del volcán de San Salvador entre neblina y cafetales. Por la tarde, la Catedral, el Palacio Nacional y el Teatro Nacional en el centro renovado.',
          EN: 'In the morning, the crater of the San Salvador volcano among mist and coffee farms. In the afternoon, the Cathedral, the National Palace and the National Theater in the renovated downtown.',
        },
        experienceIds: ['boqueron-centro-historico'],
      },
      {
        label: { ES: 'Día 3', EN: 'Day 3' },
        title: { ES: 'Surf por la mañana, atardecer en El Tunco', EN: 'Morning surf, sunset at El Tunco' },
        text: {
          ES: 'Una clase de surf en El Zonte, con olas amables para empezar, y el cierre en El Tunco viendo caer el sol detrás de su famosa roca.',
          EN: 'A surf lesson at El Zonte, with friendly waves for beginners, and a finale at El Tunco watching the sun set behind its famous rock.',
        },
        experienceIds: ['surf-el-zonte', 'atardecer-el-tunco'],
      },
    ],
    tip: {
      ES: 'Reserva el Día 1 en línea con cancelación gratis; los días 2 y 3 te los cotizamos juntos por WhatsApp.',
      EN: 'Book Day 1 online with free cancellation; we quote days 2 and 3 together on WhatsApp.',
    },
  },
  {
    slug: 'volcanes-y-playa-fin-de-semana',
    title: { ES: 'Volcanes y playa en un fin de semana', EN: 'Volcanoes and beach in a weekend' },
    summary: {
      ES: 'Cráter por la mañana, mar por la tarde y un domingo de costa.',
      EN: 'Crater in the morning, sea in the afternoon and a Sunday on the coast.',
    },
    length: { ES: 'Fin de semana', EN: 'Weekend' },
    image: {
      src: '/img/categoria-volcanes.jpg',
      alt: { ES: 'Volcanes de Santa Ana e Izalco', EN: 'Santa Ana and Izalco volcanoes' },
    },
    intro: {
      ES: 'En El Salvador la montaña y el mar están a pocas horas. Este fin de semana lo aprovecha: el sábado subes un volcán y terminas en la playa; el domingo recorres la costa sin prisa.',
      EN: 'In El Salvador the mountains and the sea are just a few hours apart. This weekend makes the most of it: on Saturday you climb a volcano and end at the beach; on Sunday you explore the coast at an easy pace.',
    },
    stops: [
      {
        label: { ES: 'Sábado', EN: 'Saturday' },
        title: { ES: 'Volcán de Santa Ana y Playa Los Almendros', EN: 'Santa Ana Volcano and Los Almendros Beach' },
        text: {
          ES: 'La subida al cráter por la mañana y, después, la tarde frente al Pacífico. Un solo día, dos paisajes y el transporte resuelto.',
          EN: 'The climb to the crater in the morning and then the afternoon facing the Pacific. One day, two landscapes and transport taken care of.',
        },
        experienceIds: ['santa-ana-playa-los-almendros'],
      },
      {
        label: { ES: 'Domingo', EN: 'Sunday' },
        title: { ES: 'Ruta de playas de Surf City', EN: 'Surf City beach route' },
        text: {
          ES: 'Las playas de la costa de La Libertad, de mirador en mirador, para ver el surf desde la orilla o meterte al agua.',
          EN: 'The beaches of the La Libertad coast, from viewpoint to viewpoint, to watch the surf from the shore or get in the water.',
        },
        experienceIds: ['surf-city-ruta'],
      },
      {
        label: { ES: 'Domingo por la tarde', EN: 'Sunday afternoon' },
        title: { ES: 'Malecón de La Libertad y mariscos', EN: 'La Libertad waterfront and seafood' },
        text: {
          ES: 'El muelle de los pescadores y un almuerzo de mariscos frente al mar para cerrar el fin de semana.',
          EN: 'The fishermen’s pier and a seafood lunch by the sea to round off the weekend.',
        },
        experienceIds: ['malecon-la-libertad'],
      },
    ],
    tip: {
      ES: 'El sábado se reserva en línea. Si quieres el domingo completo, te lo armamos con el Personal Driver.',
      EN: 'Saturday is booked online. If you want the whole Sunday, we put it together with the Personal Driver.',
    },
  },
  {
    slug: 'pueblos-con-personal-driver',
    title: { ES: 'Pueblos y café con Personal Driver', EN: 'Towns and coffee with a Personal Driver' },
    summary: {
      ES: 'Ruta de las Flores y Suchitoto a tu ritmo, con conductor local.',
      EN: 'Ruta de las Flores and Suchitoto at your own pace, with a local driver.',
    },
    length: { ES: '2 días', EN: '2 days' },
    image: {
      src: '/img/experiences/ruta-de-las-flores.jpg',
      alt: { ES: 'Iglesia de un pueblo de la Ruta de las Flores', EN: 'Church in a town on the Ruta de las Flores' },
    },
    intro: {
      ES: 'Los pueblos se disfrutan sin horario: parar en un mirador, quedarse a almorzar, entrar a una finca de café. Con el Personal Driver decides tú dónde y cuánto tiempo; el conductor conoce el camino.',
      EN: 'Towns are best enjoyed without a timetable: stopping at a viewpoint, staying for lunch, visiting a coffee farm. With the Personal Driver you decide where and for how long; the driver knows the way.',
    },
    stops: [
      {
        label: { ES: 'Día 1', EN: 'Day 1' },
        title: { ES: 'Ruta de las Flores', EN: 'Ruta de las Flores' },
        text: {
          ES: 'Nahuizalco, Salcoatitán, Juayúa, Apaneca y Concepción de Ataco: murales, artesanías y cafetales. Los fines de semana, Juayúa tiene su feria gastronómica.',
          EN: 'Nahuizalco, Salcoatitán, Juayúa, Apaneca and Concepción de Ataco: murals, crafts and coffee farms. On weekends, Juayúa holds its food fair.',
        },
        serviceId: 'personal-driver',
      },
      {
        label: { ES: 'Día 2', EN: 'Day 2' },
        title: { ES: 'Suchitoto colonial y el lago Suchitlán', EN: 'Colonial Suchitoto and Lake Suchitlán' },
        text: {
          ES: 'Calles empedradas, la iglesia de Santa Lucía y un paseo en lancha por el lago al final de la tarde.',
          EN: 'Cobblestone streets, the Santa Lucía church and a boat ride on the lake in the late afternoon.',
        },
        experienceIds: ['suchitoto-colonial'],
      },
    ],
    tip: {
      ES: `El Personal Driver se cotiza por horas, con un mínimo de ${MIN_HOURS}. Dinos qué pueblos quieres ver y te proponemos el recorrido.`,
      EN: `The Personal Driver is quoted by the hour, with a ${MIN_HOURS}-hour minimum. Tell us which towns you want to see and we will suggest a route.`,
    },
  },
]

export function getGuide(slug: string): Guide | null {
  return guides.find((guide) => guide.slug === slug) ?? null
}
