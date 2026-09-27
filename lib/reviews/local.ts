import { prisma } from '../db'
import { SEED_REVIEWS, type SeedReview } from './seed-data'
import type { ExperienceRating, ProviderResult, Review, ReviewStats } from './types'

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
 *
 * IDIOMA: las opiniones de arranque tienen traducción y se sirven en el
 * idioma pedido. Las reales se muestran tal como se escribieron.
 */

type Options = {
  /** 'en' o 'es', como lo pide la interfaz. */
  locale?: string
  /** Solo las opiniones de esta experiencia. */
  experienceId?: string
  limit?: number
}

const SEED_BY_ID = new Map(SEED_REVIEWS.map((seed) => [seed.id, seed]))

function seedText(seed: SeedReview, locale: string | undefined): string {
  return locale === 'en' ? seed.commentEn : seed.comment
}

export async function fetchLocalReviews(options: Options = {}): Promise<ProviderResult> {
  const { locale, experienceId, limit = 12 } = options

  try {
    const rows = await prisma.review.findMany({
      where: { published: true, ...(experienceId ? { experienceId } : {}) },
      orderBy: { createdAt: 'desc' }, // más reciente primero
      take: limit,
      include: { user: { select: { name: true, image: true } } },
    })

    if (rows.length === 0) {
      // Filtrando por experiencia, «ninguna» es una respuesta válida: no se
      // rellena con opiniones de otras experiencias.
      if (experienceId) return { source: 'local', configured: true, reviews: [], summary: null, notice: null }
      return fallbackResult(locale, undefined, 'La base no tiene opiniones todavía; se muestran las de arranque.')
    }

    const reviews: Review[] = rows.map((row) => {
      const seed = row.isSeed ? SEED_BY_ID.get(row.id) : undefined
      return {
        id: row.id,
        source: 'local',
        authorName: row.user?.name ?? row.authorName,
        authorPhoto: row.user?.image ?? row.authorImage,
        authorUrl: null,
        rating: row.rating,
        text: seed ? seedText(seed, locale) : row.comment,
        publishedAt: row.createdAt.toISOString(),
        relativeTime: null,
        permalink: null,
        experienceTitle: row.experienceTitle,
        experienceId: row.experienceId,
        verified: row.verified,
        isSeed: row.isSeed,
      }
    })

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
      locale,
      experienceId,
      error instanceof Error ? error.message.split('\n')[0] : 'Base de datos no disponible.',
    )
  }
}

/** Las opiniones de arranque servidas desde memoria, ya ordenadas. */
function fallbackResult(locale: string | undefined, experienceId: string | undefined, notice: string): ProviderResult {
  const reviews: Review[] = SEED_REVIEWS.filter((seed) => !experienceId || seed.experienceId === experienceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((seed) => ({
      id: seed.id,
      source: 'local' as const,
      authorName: seed.authorName,
      authorPhoto: null,
      authorUrl: null,
      rating: seed.rating,
      text: seedText(seed, locale),
      publishedAt: seed.createdAt,
      relativeTime: null,
      permalink: null,
      experienceTitle: seed.experienceTitle,
      experienceId: seed.experienceId,
      verified: false,
      isSeed: true,
    }))

  return {
    source: 'local',
    configured: true,
    reviews,
    summary: reviews.length > 0 ? buildSummary(reviews) : null,
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

/**
 * Valoración de cada experiencia con sus opiniones publicadas.
 *
 * Es la ÚNICA fuente de las estrellas del catálogo: así el número de las
 * tarjetas coincide con las opiniones que el visitante puede leer. Una
 * experiencia sin opiniones no aparece en el resultado y se muestra como
 * «Nueva», en lugar de con una cifra que nadie puede comprobar.
 */
export async function fetchReviewStats(): Promise<ReviewStats> {
  let ratings: { experienceId: string; rating: number }[]
  try {
    ratings = await prisma.review.findMany({
      where: { published: true },
      select: { experienceId: true, rating: true },
    })
    if (ratings.length === 0) ratings = SEED_REVIEWS
  } catch {
    ratings = SEED_REVIEWS
  }

  const stats: ReviewStats = {}
  for (const { experienceId, rating } of ratings) {
    const current: ExperienceRating = stats[experienceId] ?? { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] }
    const stars = Math.min(5, Math.max(1, Math.round(rating)))
    current.breakdown[stars - 1] += 1
    current.average = (current.average * current.count + rating) / (current.count + 1)
    current.count += 1
    stats[experienceId] = current
  }
  return stats
}
