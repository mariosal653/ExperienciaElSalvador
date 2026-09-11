import { hmacSha256Hex, safeEqual } from '../security'
import type { PaymentConfig } from './config'

/**
 * Cliente de la API de Wompi El Salvador. SOLO SERVIDOR.
 *
 * Referencia: https://docs.wompi.sv
 *   Autenticación         POST https://id.wompi.sv/connect/token
 *   Crear enlace de pago  POST https://api.wompi.sv/EnlacePago
 *   Consultar transacción GET  https://api.wompi.sv/TransaccionCompra/{id}
 *   Webhook               cabecera `wompi_hash` = HMAC-SHA256(cuerpo, API Secret)
 *   Redirección           `hash` = HMAC-SHA256(identificadorEnlaceComercio
 *                         + idTransaccion + idEnlace + monto, API Secret)
 *
 * Los datos de la tarjeta se escriben en la página de Wompi. Esta app
 * nunca los ve.
 */

type WompiConfig = Extract<PaymentConfig, { mode: 'sandbox' | 'production' }>

const TIMEOUT_MS = 15_000

export class WompiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'WompiError'
  }
}

/* ------------------------------------------------------------------ */
/* Token                                                               */
/* ------------------------------------------------------------------ */

let cachedToken: { value: string; expiresAt: number; clientId: string } | null = null

async function getAccessToken(config: WompiConfig): Promise<string> {
  // Se reutiliza mientras le quede más de un minuto de vida. En Netlify
  // cada función es efímera, así que la caché dura lo que dure la instancia.
  if (cachedToken && cachedToken.clientId === config.clientId && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.value
  }

  const response = await fetch(config.authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      audience: 'wompi_api',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })

  if (!response.ok) {
    // Nunca se registra el cuerpo de la petición: lleva el secreto.
    throw new WompiError(`auth failed (${response.status})`, response.status)
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!payload.access_token) throw new WompiError('auth: no access_token')

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    clientId: config.clientId,
  }
  return payload.access_token
}

async function wompiFetch<T>(config: WompiConfig, path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken(config)
  const response = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new WompiError(`${init.method ?? 'GET'} ${path} → ${response.status} ${detail.slice(0, 300)}`, response.status)
  }
  return (await response.json()) as T
}

/* ------------------------------------------------------------------ */
/* Enlace de pago                                                      */
/* ------------------------------------------------------------------ */

export type CreateLinkInput = {
  reference: string
  amountCents: number
  productName: string
  description: string
  imageUrl?: string
  redirectUrl: string
  webhookUrl: string
}

export type CreatedLink = { linkId: string; checkoutUrl: string; isProduction: boolean }

export async function createPaymentLink(config: WompiConfig, input: CreateLinkInput): Promise<CreatedLink> {
  const notifyEmails = process.env.WOMPI_NOTIFY_EMAILS?.trim()

  const body = {
    identificadorEnlaceComercio: input.reference,
    // Wompi trabaja en dólares con dos decimales.
    monto: Number((input.amountCents / 100).toFixed(2)),
    nombreProducto: input.productName.slice(0, 100),
    formaPago: { permitirTarjetaCreditoDebido: true },
    infoProducto: {
      descripcionProducto: input.description.slice(0, 500),
      ...(input.imageUrl?.startsWith('https://') ? { urlImagenProducto: input.imageUrl } : {}),
    },
    configuracion: {
      urlRedirect: input.redirectUrl,
      urlWebhook: input.webhookUrl,
      notificarTransaccionCliente: true,
      ...(notifyEmails ? { emailsNotificacion: notifyEmails } : {}),
    },
    // Un enlace, un pago: impide que alguien pague dos veces la misma reserva.
    limitesDeUso: { cantidadMaximaPagosExitosos: 1 },
  }

  const payload = await wompiFetch<{
    idEnlace?: number | string
    urlEnlace?: string
    estaProductivo?: boolean
  }>(config, '/EnlacePago', { method: 'POST', body: JSON.stringify(body) })

  if (!payload.urlEnlace || payload.idEnlace === undefined) {
    throw new WompiError('EnlacePago: respuesta sin urlEnlace')
  }

  return {
    linkId: String(payload.idEnlace),
    checkoutUrl: payload.urlEnlace,
    isProduction: Boolean(payload.estaProductivo),
  }
}

/* ------------------------------------------------------------------ */
/* Consulta de transacción — la verificación que manda                 */
/* ------------------------------------------------------------------ */

export type VerifiedTransaction = {
  transactionId: string
  approved: boolean
  isReal: boolean
  amountCents: number
  authorizationCode: string | null
  message: string | null
}

export async function getTransaction(config: WompiConfig, transactionId: string): Promise<VerifiedTransaction> {
  // Solo caracteres de un identificador: el valor llega de fuera.
  if (!/^[A-Za-z0-9-]{1,100}$/.test(transactionId)) {
    throw new WompiError('invalid transaction id')
  }

  const payload = await wompiFetch<{
    idTransaccion?: string
    esAprobada?: boolean
    esReal?: boolean
    monto?: number
    codigoAutorizacion?: string
    mensaje?: string
  }>(config, `/TransaccionCompra/${encodeURIComponent(transactionId)}`)

  return {
    transactionId: String(payload.idTransaccion ?? transactionId),
    approved: payload.esAprobada === true,
    isReal: payload.esReal === true,
    amountCents: Math.round(Number(payload.monto ?? 0) * 100),
    authorizationCode: payload.codigoAutorizacion ?? null,
    message: payload.mensaje ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* Firmas                                                              */
/* ------------------------------------------------------------------ */

/**
 * Verifica la firma del webhook sobre el cuerpo CRUDO. Hay que leerlo con
 * `request.text()` antes de parsearlo: volver a serializar un JSON cambia
 * espacios y orden, y la firma dejaría de coincidir.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = hmacSha256Hex(secret, rawBody)
  return safeEqual(expected, signature.trim().toLowerCase())
}

/** Verifica el `hash` de la URL de retorno del enlace de pago. */
export function verifyRedirectSignature(
  params: { reference: string; transactionId: string; linkId: string; amount: string; hash: string },
  secret: string,
): boolean {
  if (!params.hash || !secret) return false
  const expected = hmacSha256Hex(secret, params.reference + params.transactionId + params.linkId + params.amount)
  return safeEqual(expected, params.hash.trim().toLowerCase())
}

/** Cuerpo del webhook según la documentación de Wompi. */
export type WompiWebhookPayload = {
  IdTransaccion?: string
  ResultadoTransaccion?: string
  Monto?: number
  CodigoAutorizacion?: string
  EsProductiva?: boolean
  EnlacePago?: { Id?: number | string; IdentificadorEnlaceComercio?: string; NombreProducto?: string }
}
