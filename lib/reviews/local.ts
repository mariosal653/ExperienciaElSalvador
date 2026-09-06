import { prisma } from '../db'
import type { ProviderResult, Review } from './types'

/**
 * Opiniones propias, guardadas en nuestra base de datos.
 *
 * Convive con Google: la sección mezcla ambas fuentes y cada tarjeta
 * muestra de dónde viene. Este proveedor no necesita credenciales, así que
 * siempre está `configured: true`.
 *
 * Incluye las 4 opiniones de arranque (`isSeed`) y las opiniones reales de
 * usuarios que completaron una reserva (`verified`).
 */
export async function fetchLocalReviews(limit = 12): Promise<ProviderResult> {
  try {
    const rows = await prisma.review.findMany({
      where: { published: true },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      include: { user: { select: { name: true, image: true } } },
    })

    const reviews: Review[] = rows.map((row) => ({
      id: row.id,
      source: 'local',
      authorName: row.user?.name ?? row.authorName,
      authorPhoto: row.user?.image ?? row.authorImage,
      authorUrl: null,
      rating: row.rating,
      text: row.comment,
      publishedAt: row.createdAt.toISOString(),
      relativeTime: null,
      permalink: null,
      experienceTitle: row.experienceTitle,
      verified: row.verified,
      isSeed: row.isSeed,
    }))

    const rated = rows.filter((row) => row.rating > 0)
    const average =
      rated.length > 0 ? rated.reduce((sum, row) => sum + row.rating, 0) / rated.length : null

    return {
      source: 'local',
      configured: true,
      reviews,
      summary: {
        source: 'local',
        averageRating: average,
        totalCount: rows.length,
        profileUrl: null,
      },
      notice: null,
    }
  } catch (error) {
    return {
      source: 'local',
      configured: true,
      reviews: [],
      summary: null,
      notice: error instanceof Error ? error.message : 'No se pudieron leer las opiniones.',
    }
  }
}
