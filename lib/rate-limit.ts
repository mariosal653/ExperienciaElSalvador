/**
 * Límite de peticiones en memoria, por clave (normalmente la IP).
 *
 * Es una protección BÁSICA: en Netlify cada instancia de función tiene su
 * propia memoria, así que el límite es por instancia. Frena el abuso
 * casual (un script que crea cientos de reservas pendientes para bloquear
 * cupo); para algo más serio hace falta un almacén compartido.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()

  // Limpieza perezosa para que el mapa no crezca sin fin.
  if (buckets.size > 5000) {
    for (const [k, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(k)
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfter: 0 }
}

/** IP del cliente según las cabeceras del proxy (Netlify pone x-nf-client-connection-ip). */
export function clientIp(request: Request): string {
  const headers = request.headers
  return (
    headers.get('x-nf-client-connection-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}
