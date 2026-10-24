import type { Locale } from './data'

/**
 * Vídeo de la portada (acuerdo 03: «agregar video de inicio»).
 *
 * EL VÍDEO ACTUAL: el malecón del Puerto de La Libertad (Surf City) visto
 * desde el aire, de Irvinteli en Pixabay. Son los últimos 11 segundos del
 * original de 4K y 25 s, recortados a 16:9, reescalados a 1080p y con el
 * final fundido sobre el principio para que el bucle no dé un salto. De
 * 41 MB a 2,8 MB. Origen y licencia, en lib/credits.ts.
 *
 * CÓMO SE CAMBIA: copiar el archivo nuevo a /public/video y cambiar
 * `heroVideo.sources`. Con la lista vacía, el héroe se queda con la
 * fotografía de Cerro Verde y no hay ni pantalla negra ni hueco.
 *
 * Requisitos del archivo:
 *   - MP4 (H.264, sin audio): lo reproduce cualquier iPhone sin pedir nada.
 *   - Horizontal 1920×1080, entre 8 y 20 segundos, pensado para repetirse.
 *   - Menos de 6 MB. La foto del héroe pesa ~200 KB: un vídeo de 30 MB
 *     retrasa todo lo demás.
 *   - Sin texto incrustado: la portada es bilingüe.
 *
 * El vídeo SIEMPRE arranca silenciado y sin controles: es fondo, no
 * contenido. Y nunca se reproduce si el sistema pide menos movimiento
 * (`prefers-reduced-motion`) o si el navegador está en modo de ahorro de
 * datos; en esos casos se ve la fotografía.
 *
 * LICENCIA: igual que las fotos, solo material que se pueda usar en un
 * sitio comercial. Al añadir el archivo, registrar su origen en
 * lib/credits.ts.
 */

export type HeroVideoSource = { src: string; type: string }

export const heroVideo = {
  /** Vacío = la portada se queda con la fotografía. */
  sources: [{ src: '/video/el-salvador-surf-city.mp4', type: 'video/mp4' }] as HeroVideoSource[],

  /**
   * Imagen mientras el vídeo carga. Es la misma del héroe, así que la
   * transición no se nota.
   */
  poster: '/img/hero/cerro-verde-izalco-1920.jpg',

  /**
   * Descripción para quien no puede verlo. Un vídeo decorativo no necesita
   * subtítulos, pero sí decir qué muestra.
   */
  description: {
    ES: 'Vista aérea del malecón y la playa del Puerto de La Libertad',
    EN: 'Aerial view of the seafront and beach at Puerto de La Libertad',
  } as Record<Locale, string>,
} as const

/** `true` cuando hay vídeo configurado y conviene montar el reproductor. */
export function hasHeroVideo(): boolean {
  return heroVideo.sources.length > 0
}
