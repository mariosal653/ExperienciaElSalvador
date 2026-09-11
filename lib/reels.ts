import { credits, type Credit } from './credits'
import type { Locale } from './data'

/**
 * Reels de la portada.
 *
 * Estructura pedida: { id, title, location, thumbnail, videoUrl, experienceId }.
 * Campos añadidos:
 *   - videoSources: varias fuentes del mismo vídeo (MP4 H.264 primero, que
 *     reproduce cualquier iPhone; WebM después). `videoUrl` es la primera.
 *   - poster: imagen grande para el visor (la miniatura es más ligera).
 *   - credit: autoría obligatoria de las imágenes con licencia CC.
 *
 * SIN VÍDEO: si `videoUrl` es null, el visor muestra la foto con un
 * movimiento lento de cámara (estilo «historia»). Así la sección funciona
 * desde el primer día y cada reel se puede cambiar por un vídeo real solo
 * con rellenar su URL — copiando el archivo a /public/reels o apuntando a
 * un CDN. Formato recomendado: vertical 1080×1920, MP4 H.264, 10–30 s,
 * menos de 8 MB.
 */

export type ReelSource = { src: string; type: string }

export type Reel = {
  id: string
  title: Record<Locale, string>
  location: string
  thumbnail: string
  poster: string
  videoUrl: string | null
  videoSources: ReelSource[]
  /** Si existe, el visor muestra «Ver experiencia». */
  experienceId: string | null
  credit: Credit
  /** Encuadre (object-position) al recortar a vertical. Por defecto, centro. */
  focus?: string
}

function photoReel(reel: Omit<Reel, 'videoUrl' | 'videoSources'>): Reel {
  return { ...reel, videoUrl: null, videoSources: [] }
}

export const reels: Reel[] = [
  photoReel({
    id: 'santa-ana-volcano',
    title: { ES: 'Volcán de Santa Ana', EN: 'Santa Ana Volcano' },
    location: 'Santa Ana',
    thumbnail: '/img/reels/thumbs/santa-ana.jpg',
    poster: '/img/reels/santa-ana.jpg',
    experienceId: 'volcan-santa-ana',
    credit: credits.santaAna,
  }),
  photoReel({
    id: 'el-tunco',
    title: { ES: 'El Tunco', EN: 'El Tunco' },
    location: 'La Libertad',
    thumbnail: '/img/reels/thumbs/el-tunco.jpg',
    poster: '/img/reels/el-tunco.jpg',
    experienceId: 'atardecer-el-tunco',
    // La roca está a la derecha de la foto horizontal.
    focus: '78% center',
    credit: credits.elTunco,
  }),
  photoReel({
    id: 'ruta-de-las-flores',
    title: { ES: 'Ruta de las Flores', EN: 'Ruta de las Flores' },
    location: 'Juayúa',
    thumbnail: '/img/reels/thumbs/ruta-de-las-flores.jpg',
    poster: '/img/reels/ruta-de-las-flores.jpg',
    experienceId: 'ruta-de-las-flores',
    credit: credits.juayua,
  }),
  photoReel({
    id: 'lago-de-coatepeque',
    title: { ES: 'Lago de Coatepeque', EN: 'Lake Coatepeque' },
    location: 'Santa Ana',
    thumbnail: '/img/reels/thumbs/coatepeque.jpg',
    poster: '/img/reels/coatepeque.jpg',
    experienceId: 'kayak-coatepeque',
    credit: credits.coatepeque,
  }),
  photoReel({
    id: 'suchitoto',
    title: { ES: 'Suchitoto', EN: 'Suchitoto' },
    location: 'Cuscatlán',
    thumbnail: '/img/reels/thumbs/suchitoto.jpg',
    poster: '/img/reels/suchitoto.jpg',
    experienceId: 'suchitoto-colonial',
    credit: credits.suchitoto,
  }),
  photoReel({
    id: 'surf-beach',
    title: { ES: 'Surf y playa', EN: 'Surf & beach' },
    location: 'Costa del Pacífico',
    thumbnail: '/img/reels/thumbs/surf.jpg',
    poster: '/img/reels/surf.jpg',
    experienceId: 'surf-el-zonte',
    credit: credits.sunset,
  }),
  {
    id: 'san-miguel-volcano',
    title: { ES: 'Volcán de San Miguel', EN: 'San Miguel Volcano' },
    location: 'San Miguel',
    thumbnail: '/img/reels/thumbs/san-miguel.jpg',
    poster: '/img/reels/san-miguel.jpg',
    // Único vídeo real por ahora. Commons solo lo ofrece en WebM (VP9):
    // si el navegador no lo reproduce, el visor cae a la foto sin error.
    videoUrl: '/reels/san-miguel.webm',
    videoSources: [{ src: '/reels/san-miguel.webm', type: 'video/webm' }],
    // No hay experiencia en San Miguel en el catálogo: sin botón.
    experienceId: null,
    credit: credits.sanMiguel,
  },
]
