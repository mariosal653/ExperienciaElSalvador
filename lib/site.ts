/**
 * URL pública del sitio, para construir enlaces absolutos: retorno de la
 * pasarela, webhook, QR de las entradas y correos.
 *
 * Orden de preferencia:
 *   1. SITE_URL           — la que se configure a mano (recomendado).
 *   2. URL                — la pone Netlify: URL principal del sitio.
 *   3. DEPLOY_PRIME_URL   — Netlify, en deploys de rama / preview.
 *   4. origen de la petición, si se pasa.
 *   5. http://localhost:3000
 */
export function getSiteUrl(requestOrigin?: string | null): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    requestOrigin ?? undefined,
    'http://localhost:3000',
  ]
  const value = candidates.find((item) => item && /^https?:\/\//.test(item)) ?? 'http://localhost:3000'
  return value.replace(/\/+$/, '')
}

/** Origen de una petición entrante (para el fallback de desarrollo). */
export function originOf(request: Request): string | null {
  try {
    return new URL(request.url).origin
  } catch {
    return null
  }
}
