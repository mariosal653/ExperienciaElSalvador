/**
 * Modelo normalizado de reseñas.
 *
 * Google es el primer proveedor, pero la interfaz no sabe nada de Google:
 * consume este tipo. Añadir Facebook o TikTok será escribir otro proveedor
 * que devuelva `Review[]`, sin tocar ni un componente.
 */

export type ReviewSource = 'local' | 'google' | 'facebook' | 'tiktok'

export type Review = {
  /** Único dentro de su plataforma. */
  id: string
  source: ReviewSource
  authorName: string
  /** URL del avatar. Si falta, la tarjeta dibuja la inicial. */
  authorPhoto: string | null
  /** Enlace al perfil del autor, cuando la plataforma lo da. */
  authorUrl: string | null
  /** 1 a 5. `null` en plataformas sin estrellas, como TikTok. */
  rating: number | null
  text: string
  /** ISO 8601. */
  publishedAt: string | null
  /** «hace 2 meses», tal como lo devuelve la plataforma. */
  relativeTime: string | null
  /** Enlace a la reseña o publicación original. */
  permalink: string | null
  /** Experiencia sobre la que opina, cuando se conoce. */
  experienceTitle?: string | null
  /** Escrita por quien completó la reserva. */
  verified?: boolean
  /** Contenido de arranque, etiquetado como tal en la interfaz. */
  isSeed?: boolean
}

export type ReviewSummary = {
  source: ReviewSource
  /** Promedio de la plataforma, no de las reseñas descargadas. */
  averageRating: number | null
  /** Total de opiniones del negocio en la plataforma. */
  totalCount: number | null
  /** Página pública del negocio, para «ver todas». */
  profileUrl: string | null
}

/**
 * Estado de un proveedor. `configured: false` no es un error: significa que
 * todavía no se han dado las credenciales, y la interfaz debe mostrar un
 * estado vacío honesto en lugar de inventarse reseñas.
 */
export type ProviderResult = {
  source: ReviewSource
  configured: boolean
  reviews: Review[]
  summary: ReviewSummary | null
  /** Motivo cuando algo falla o falta configuración. */
  notice: string | null
}

export type ReviewsPayload = {
  providers: ProviderResult[]
  reviews: Review[]
  /** Resumen de la plataforma principal con datos, hoy Google. */
  summary: ReviewSummary | null
  fetchedAt: string
}

/** Contrato que cumple cada plataforma. */
export interface ReviewProvider {
  readonly source: ReviewSource
  isConfigured(): boolean
  fetchReviews(locale: string): Promise<ProviderResult>
}

export function emptyResult(source: ReviewSource, notice: string): ProviderResult {
  return { source, configured: false, reviews: [], summary: null, notice }
}
