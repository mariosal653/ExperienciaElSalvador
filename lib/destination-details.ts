import { destinations, experiences, type Destination, type Experience, type Locale } from './data'

/**
 * Páginas de destino (/destinos/<id>): texto de presentación y la lista de
 * experiencias de ese destino. Solo existen para los destinos que tienen al
 * menos una experiencia, para no publicar páginas vacías.
 */

type Text = Record<Locale, string>

const INTRO: Record<string, Text> = {
  'san-salvador': {
    ES: 'La capital del país. Su centro histórico reúne el Palacio Nacional, la Catedral Metropolitana y el Teatro Nacional, a pocas cuadras unos de otros.',
    EN: "The country's capital. Its historic center brings together the National Palace, the Metropolitan Cathedral and the National Theatre, a few blocks apart.",
  },
  'santa-ana': {
    ES: 'La segunda ciudad del país y puerta de entrada a los volcanes del occidente y al bosque nuboso de Montecristo.',
    EN: "The country's second city and the gateway to the western volcanoes and the Montecristo cloud forest.",
  },
  'ruta-de-las-flores': {
    ES: 'Una carretera de montaña entre Sonsonate y Ahuachapán que une pueblos de colores, fincas de café, murales y mercados de artesanías.',
    EN: 'A mountain road between Sonsonate and Ahuachapán linking colorful towns, coffee farms, murals and handicraft markets.',
  },
  'el-tunco': {
    ES: 'Pueblo surfero de la costa de La Libertad, conocido por la roca frente a su playa y por sus atardeceres.',
    EN: 'A surf town on the La Libertad coast, known for the rock off its beach and for its sunsets.',
  },
  'el-zonte': {
    ES: 'Playa tranquila de la costa de La Libertad, con olas constantes y buen ambiente para aprender a surfear.',
    EN: 'A laid-back beach on the La Libertad coast, with consistent waves and a good vibe for learning to surf.',
  },
  suchitoto: {
    ES: 'Pueblo colonial de calles empedradas sobre el lago Suchitlán, con galerías de arte y tradición en el teñido con añil.',
    EN: 'A colonial town of cobblestone streets above Lake Suchitlán, with art galleries and a tradition of indigo dyeing.',
  },
  'lago-de-coatepeque': {
    ES: 'Un lago dentro de una caldera volcánica en Santa Ana, famoso por sus tonos de azul.',
    EN: 'A lake inside a volcanic caldera in Santa Ana, known for its shades of blue.',
  },
  'volcan-de-santa-ana': {
    ES: 'El Ilamatepec, el volcán más alto de El Salvador, con una laguna de color turquesa dentro del cráter.',
    EN: 'Ilamatepec, the highest volcano in El Salvador, with a turquoise lagoon inside its crater.',
  },
  'la-libertad': {
    ES: 'Puerto del Pacífico con muelle de pescadores, mercado de mariscos y malecón.',
    EN: "A Pacific port with a fishermen's pier, a seafood market and a waterfront promenade.",
  },
  'surf-city': {
    ES: 'El tramo de costa de La Libertad con playas como El Tunco y El Sunzal, y algunas de las olas más conocidas del país.',
    EN: 'The stretch of La Libertad coast with beaches such as El Tunco and El Sunzal, and some of the best-known waves in the country.',
  },
}

export type DestinationPage = {
  destination: Destination
  intro: Text
  experiences: Experience[]
  image: { src: string; alt: Text }
}

/** Destinos con experiencias, en el orden del catálogo. */
export function destinationPages(): DestinationPage[] {
  return destinations
    .map((destination) => {
      const list = experiences.filter((item) => item.destination === destination.name)
      if (list.length === 0) return null
      return {
        destination,
        intro: INTRO[destination.id] ?? { ES: '', EN: '' },
        experiences: list,
        image: { src: list[0].image, alt: list[0].imageAlt },
      }
    })
    .filter((page): page is DestinationPage => page !== null)
}

export function getDestinationPage(id: string): DestinationPage | null {
  return destinationPages().find((page) => page.destination.id === id) ?? null
}

/** Id (slug) del destino a partir del nombre que usa cada experiencia. */
export function destinationIdByName(name: string): string | null {
  return destinations.find((destination) => destination.name === name)?.id ?? null
}
