/**
 * Opiniones de arranque — ÚNICA fuente de verdad.
 *
 * Se usan en dos sitios:
 *   1. `prisma/seed.ts` las inserta en la base con `upsert` sobre un id
 *      fijo, de modo que ejecutar el seed varias veces no duplica nada.
 *   2. `lib/reviews/local.ts` las usa como respaldo si la base todavía no
 *      tiene opiniones o no está disponible, para que la sección nunca se
 *      vea vacía.
 *
 * En cuanto haya opiniones reales, estas dejan de mostrarse solas: la
 * consulta ordena por fecha descendente y las reales, al ser más recientes,
 * salen primero.
 */

export type SeedReview = {
  id: string
  authorName: string
  /** Iniciales sobre color de marca. Sin dependencias ni red. */
  avatarColor: string
  experienceId: string
  experienceTitle: string
  rating: number
  comment: string
  createdAt: string
}

export const SEED_REVIEWS: SeedReview[] = [
  {
    id: 'seed-cultural-suchitoto',
    authorName: 'Peter Lindqvist',
    avatarColor: '#2a6b78',
    experienceId: 'suchitoto-colonial',
    experienceTitle: 'Suchitoto colonial y lago Suchitlán',
    rating: 5,
    comment:
      'Llegué desde Suecia sin hablar casi nada de español y el guía cambió al inglés sin que se lo pidiera. Las calles coloniales, la iglesia y el paseo en lancha por el lago hicieron un día muy completo. Reservar fue cuestión de dos minutos.',
    createdAt: '2026-08-30T11:05:00.000Z',
  },
  {
    id: 'seed-familia-coatepeque',
    authorName: 'Familia Menjívar',
    avatarColor: '#b8481c',
    experienceId: 'kayak-coatepeque',
    experienceTitle: 'Kayak en el Lago de Coatepeque',
    rating: 4,
    comment:
      'Fuimos con dos niños de 8 y 11 años. Nos dieron chalecos para todos y el instructor tuvo muchísima paciencia con los peques. Lo único: llegamos casi al mediodía y pegaba fuerte el sol, mejor ir temprano.',
    createdAt: '2026-08-24T14:10:00.000Z',
  },
  {
    id: 'seed-pareja-volcan',
    authorName: 'Daniel y Sofía',
    avatarColor: '#173f45',
    experienceId: 'volcan-santa-ana',
    experienceTitle: 'Volcán de Santa Ana',
    rating: 5,
    comment:
      'Subimos como pareja sin ser nada deportistas y el ritmo del grupo fue perfecto. La laguna del cráter con ese verde turquesa no se parece a nada que hayamos visto antes. Salir a las cinco de la mañana vale cada minuto de sueño perdido.',
    createdAt: '2026-08-02T18:45:00.000Z',
  },
  {
    id: 'seed-gastronomia',
    authorName: 'Marcela Rivas',
    avatarColor: '#8a5d0c',
    experienceId: 'ruta-de-las-flores',
    experienceTitle: 'Ruta de las Flores',
    rating: 5,
    comment:
      'Fui por la feria gastronómica de Juayúa y terminé quedándome todo el día. El guía nos llevó a una cocina donde hacían pupusas de chipilín como las de mi abuela. Comimos muchísimo y aun así el precio me pareció justo.',
    createdAt: '2026-07-19T15:20:00.000Z',
  },
]

/** Color estable para el avatar de cualquier autor, sin red ni dependencias. */
const AVATAR_COLORS = ['#173f45', '#2a6b78', '#b8481c', '#8a5d0c', '#2f7d63', '#6b3220']

export function avatarColorFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
