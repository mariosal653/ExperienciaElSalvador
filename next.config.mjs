/**
 * Cabeceras de las páginas que llevan una llave en la URL (reserva,
 * entradas, retorno de pago): sin Referer hacia otros sitios, para que la
 * llave no viaje en la cabecera al pulsar un enlace externo.
 */
const PRIVATE_PAGE_HEADERS = [
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Cache-Control', value: 'private, no-store' },
]

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // El build FALLA si hay errores de tipos. Antes estaba en true y un
    // error de tipos podía llegar a producción sin que nadie lo viera.
    ignoreBuildErrors: false,
  },
  images: {
    // Las imágenes locales ya se sirven redimensionadas (ver lib/credits.ts)
    // y las de Unsplash llevan su propio ancho en la URL.
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      { source: '/booking/:path*', headers: PRIVATE_PAGE_HEADERS },
      { source: '/ticket/:path*', headers: PRIVATE_PAGE_HEADERS },
      { source: '/checkout/:path*', headers: PRIVATE_PAGE_HEADERS },
      // Vídeos y fotos de /public: nombres estables, caché larga en el CDN.
      { source: '/reels/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      { source: '/img/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
    ]
  },
}

export default nextConfig
