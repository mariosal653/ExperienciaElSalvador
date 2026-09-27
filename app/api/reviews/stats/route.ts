import { NextResponse } from 'next/server'
import { fetchReviewStats } from '@/lib/reviews'

/**
 * GET /api/reviews/stats
 *
 * Valoración media, número de opiniones y desglose por estrellas de cada
 * experiencia. Lo usan las tarjetas del catálogo y la página de detalle,
 * que son estáticas: así sus cifras salen de las opiniones reales.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await fetchReviewStats(), {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' },
  })
}
