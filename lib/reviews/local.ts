import { prisma } from '../db'
import { SEED_REVIEWS } from './seed-data'
import type { ProviderResult, Review } from './types'

/**
 * Opiniones propias.
 *
 * ORDEN: siempre de la más reciente a la más antigua, por `createdAt`. Una
 * opinión nueva aparece primero sin tocar nada del frontend.
 *
 * LA SECCIÓN NUNCA QUEDA VACÍA. Tres escenarios:
 *
 *   1. Hay opiniones en la base → se muestran esas, las reales primero por
 *      ser más recientes.
 *   2. La base responde pero está vacía (seed no ejecutado) → se usan las
 *      de arranque como respaldo, en memoria.
 *   3. La base no está disponible → mismo respaldo, y se anota el motivo.
 *
 * El respaldo en memoria NO escribe nada: no duplica registros ni depende
 * de que alguien recuerde ejecutar el seed.
 */
export async function fetchLocalReviews(limit = 12): Promise<ProviderResult> {
  try {
    const rows = await prisma.review.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }, // más reciente primero
      take: limit,
      include: { user: { select: { name: true, image: true } } },
    })

    if (rows.length === 0) {
      return fallbackResult('La base no tiene opiniones todavía; se muestran las de arranque.')
    }

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

    return {
      source: 'local',
      configured: true,
      reviews,
      summary: buildSummary(reviews),
      notice: null,
    }
  } catch (error) {
    // Base caída o sin migrar: la sección sigue mostrando algo.
    return fallbackResult(
      error instanceof Error ? error.message.split('\n')[0] : 'Base de datos no disponible.',
    )
  }
}

/** Las opiniones de arranque servidas desde memoria, ya ordenadas. */
function fallbackResult(notice: string): ProviderResult {
  const reviews: Review[] = [...SEED_REVIEWS]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((seed) => ({
      id: seed.id,
      source: 'local' as const,
      authorName: seed.authorName,
      authorPhoto: null,
      authorUrl: null,
      rating: seed.rating,
      text: seed.comment,
      publishedAt: seed.createdAt,
      relativeTime: null,
      permalink: null,
      experienceTitle: seed.experienceTitle,
      verified: false,
      isSeed: true,
    }))

  return {
    source: 'local',
    configured: true,
    reviews,
    summary: buildSummary(reviews),
    notice,
  }
}

function buildSummary(reviews: Review[]) {
  const rated = reviews.filter((review) => typeof review.rating === 'number')
  const average =
    rated.length > 0
      ? rated.reduce((sum, review) => sum + (review.rating ?? 0), 0) / rated.length
      : null

  return {
    source: 'local' as const,
    averageRating: average,
    totalCount: reviews.length,
    profileUrl: null,
  }
}
