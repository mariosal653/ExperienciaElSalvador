import { googleProvider } from './google'
import { emptyResult, type ReviewProvider, type ReviewsPayload } from './types'

/**
 * Registro de proveedores de reseñas.
 *
 * Para añadir Facebook o TikTok: escribir un módulo que exporte un
 * `ReviewProvider` y agregarlo a esta lista. La interfaz no cambia.
 *
 * Estado real de cada plataforma, para que la planificación sea honesta:
 *
 *   Google    Places API (New). Máximo 5 reseñas, sin paginación. Listo,
 *             solo faltan las credenciales.
 *
 *   Facebook  Graph API, campo `ratings` de la página. Exige un token de
 *             página y la revisión de la app por parte de Meta
 *             (permiso Page Public Content Access). Semanas de trámite.
 *
 *   TikTok    NO existe una API pública de reseñas: TikTok no tiene
 *             sistema de opiniones de negocio. Lo que sí se puede es
 *             mostrar vídeos de testimonio mediante el oEmbed público o
 *             la Display API. Se modelaría con rating = null.
 */
const providers: ReviewProvider[] = [googleProvider]

/** Proveedores previstos que todavía no tienen implementación. */
const planned = [
  { source: 'facebook' as const, notice: 'Facebook aún no está conectado.' },
  { source: 'tiktok' as const, notice: 'TikTok aún no está conectado.' },
]

export async function getReviews(locale: string): Promise<ReviewsPayload> {
  const results = await Promise.all(providers.map((provider) => provider.fetchReviews(locale)))

  const all = results.flatMap((result) => result.reviews)

  // Más recientes primero; las que no traen fecha van al final.
  all.sort((a, b) => {
    if (!a.publishedAt) return 1
    if (!b.publishedAt) return -1
    return b.publishedAt.localeCompare(a.publishedAt)
  })

  const summary = results.find((result) => result.summary !== null)?.summary ?? null

  return {
    providers: [...results, ...planned.map((p) => emptyResult(p.source, p.notice))],
    reviews: all,
    summary,
    fetchedAt: new Date().toISOString(),
  }
}

export { googleProvider }
export * from './types'
