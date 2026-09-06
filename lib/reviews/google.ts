import { emptyResult, type ProviderResult, type Review, type ReviewProvider } from './types'

/**
 * Proveedor de Google (Places API New).
 *
 * LÍMITE DE LA PLATAFORMA: Places API devuelve como máximo 5 reseñas por
 * lugar, y no admite paginación. No es una decisión de este código. Para
 * traer el historial completo hace falta la API de Google Business Profile,
 * que exige ser el dueño verificado del negocio y pasar una aprobación.
 *
 * Las credenciales viven solo en el servidor. Este módulo se importa
 * únicamente desde app/api/reviews/route.ts; las variables NO llevan
 * prefijo NEXT_PUBLIC_, así que la clave nunca llega al navegador.
 */

const ENDPOINT = 'https://places.googleapis.com/v1/places'

/** Campos que se piden. Google cobra según el conjunto solicitado. */
const FIELDS = [
  'id',
  'displayName',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'reviews',
].join(',')

type GoogleReview = {
  name?: string
  relativePublishTimeDescription?: string
  rating?: number
  text?: { text?: string; languageCode?: string }
  originalText?: { text?: string; languageCode?: string }
  publishTime?: string
  authorAttribution?: {
    displayName?: string
    uri?: string
    photoUri?: string
  }
}

type GooglePlaceResponse = {
  id?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: GoogleReview[]
  error?: { message?: string; status?: string }
}

function config() {
  return {
    apiKey: process.env.GOOGLE_PLACES_API_KEY ?? '',
    placeId: process.env.GOOGLE_PLACE_ID ?? '',
  }
}

export const googleProvider: ReviewProvider = {
  source: 'google',

  isConfigured() {
    const { apiKey, placeId } = config()
    return apiKey.length > 0 && placeId.length > 0
  },

  async fetchReviews(locale: string): Promise<ProviderResult> {
    const { apiKey, placeId } = config()

    if (!apiKey || !placeId) {
      return emptyResult(
        'google',
        'Faltan GOOGLE_PLACES_API_KEY y/o GOOGLE_PLACE_ID en las variables de entorno.',
      )
    }

    const url = `${ENDPOINT}/${encodeURIComponent(placeId)}?languageCode=${encodeURIComponent(locale)}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELDS,
        },
        // Google no permite almacenar sus reseñas de forma indefinida.
        // Una hora mantiene el contenido fresco sin gastar cuota en cada visita.
        next: { revalidate: 3600 },
      })

      if (!response.ok) {
        const detail = await response.text()
        return {
          source: 'google',
          configured: true,
          reviews: [],
          summary: null,
          notice: `Google respondió ${response.status}. ${detail.slice(0, 200)}`,
        }
      }

      const data = (await response.json()) as GooglePlaceResponse

      if (data.error) {
        return {
          source: 'google',
          configured: true,
          reviews: [],
          summary: null,
          notice: data.error.message ?? 'Error desconocido de Google Places.',
        }
      }

      const reviews: Review[] = (data.reviews ?? []).map((raw, index) => ({
        id: raw.name ?? `google-${index}`,
        source: 'google' as const,
        authorName: raw.authorAttribution?.displayName?.trim() || 'Google',
        authorPhoto: raw.authorAttribution?.photoUri ?? null,
        authorUrl: raw.authorAttribution?.uri ?? null,
        rating: typeof raw.rating === 'number' ? raw.rating : null,
        text: (raw.text?.text ?? raw.originalText?.text ?? '').trim(),
        publishedAt: raw.publishTime ?? null,
        relativeTime: raw.relativePublishTimeDescription ?? null,
        permalink: data.googleMapsUri ?? null,
      }))

      return {
        source: 'google',
        configured: true,
        reviews: reviews.filter((review) => review.text.length > 0),
        summary: {
          source: 'google',
          averageRating: typeof data.rating === 'number' ? data.rating : null,
          totalCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : null,
          profileUrl: data.googleMapsUri ?? null,
        },
        notice: null,
      }
    } catch (error) {
      return {
        source: 'google',
        configured: true,
        reviews: [],
        summary: null,
        notice: error instanceof Error ? error.message : 'No se pudo contactar con Google Places.',
      }
    }
  },
}
