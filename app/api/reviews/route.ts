import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/reviews'

/**
 * Reseñas de las plataformas conectadas.
 *
 * Corre en el servidor para que la clave de Google no salga nunca al
 * navegador. Se cachea una hora: mantiene el contenido fresco sin gastar
 * cuota en cada visita y sin almacenar las reseñas de forma indefinida,
 * que es lo que piden las condiciones de Google.
 */
export const revalidate = 3600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('locale') === 'ES' ? 'es' : 'en'

  const payload = await getReviews(requested)

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
