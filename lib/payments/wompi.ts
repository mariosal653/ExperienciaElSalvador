import { hmacSha256Hex, safeEqual } from '../security'
import type { PaymentConfig } from './config'

/**
 * Cliente de la API de Wompi El Salvador. SOLO SERVIDOR.
 *
 * Referencia: https://docs.wompi.sv y la especificación OpenAPI en
 * https://api.wompi.sv/index.html (swagger/v1/swagger.json).
 *   Autenticación         POST https://id.wompi.sv/connect/token
 *   Crear enlace de pago  POST https://api.wompi.sv/EnlacePago
 *   Desactivar enlace     PUT  https://api.wompi.sv/EnlacePago/{id}/desactivar
 *   Consultar transacción GET  https://api.wompi.sv/TransaccionCompra/{id}
 *   Datos del aplicativo  GET  https://api.wompi.sv/Aplicativo
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
  /**
   * Botón «regresar» que Wompi muestra ANTES de que el cliente escriba la
   * tarjeta (`configuracion.urlRetorno`). Sin él, quien se arrepiente se
   * queda atrapado en la pasarela o acaba en la web del comercio.
   */
  returnUrl: string
  webhookUrl: string
  /**
   * Minutos que la interfaz de pago sigue siendo válida
   * (`configuracion.duracionInterfazIntentoMinutos`).
   *
   * Se ata al tiempo que se apartan las plazas: si la pantalla viviera más
   * que el apartado, alguien podría pagar una plaza ya liberada y habría
   * que vender de más o devolver el dinero.
   */
  expiresInMinutes: number
  /** Número de reserva: viaja en `datosAdicionales` y sale en reportes y webhooks de Wompi. */
  bookingCode?: string
}

export type CreatedLink = { linkId: string; checkoutUrl: string; isProduction: boolean }

export async function createPaymentLink(config: WompiConfig, input: CreateLinkInput): Promise<CreatedLink> {
  const notifyEmails = process.env.WOMPI_NOTIFY_EMAILS?.trim()
  const now = Date.now()

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
      urlRetorno: input.returnUrl,
      urlWebhook: input.webhookUrl,
      duracionInterfazIntentoMinutos: input.expiresInMinutes,
      notificarTransaccionCliente: true,
      ...(notifyEmails ? { emailsNotificacion: notifyEmails } : {}),
    },
    // Un enlace, un pago: impide que alguien pague dos veces la misma reserva.
    //
    // `cantidadMaximaPagosFallidos` se deja SIN definir a propósito: limita
    // los intentos fallidos antes de desactivar el enlace, y un cliente al
    // que le rechazan la tarjeta tiene que poder probar con otra.
    limitesDeUso: { cantidadMaximaPagosExitosos: 1 },
    // El ENLACE caduca a la vez que el apartado de plazas (`vigencia.fechaFin`).
    // `duracionInterfazIntentoMinutos` solo limita cada pantalla de pago: sin
    // fecha de fin, el mismo enlace se podía volver a abrir y pagar horas o
    // días después, con las plazas ya liberadas y quizá vendidas a otro.
    // El inicio se adelanta unos minutos por si el reloj de Wompi va detrás.
    vigencia: {
      fechaInicio: new Date(now - 5 * 60_000).toISOString(),
      fechaFin: new Date(now + input.expiresInMinutes * 60_000).toISOString(),
    },
    ...(input.bookingCode ? { datosAdicionales: { reserva: input.bookingCode } } : {}),
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

/**
 * Desactiva un enlace para que no admita más pagos. Se usa al liberar o
 * vencer una reserva que tenía un enlace abierto.
 */
export async function deactivatePaymentLink(config: WompiConfig, linkId: string): Promise<void> {
  if (!/^\d{1,12}$/.test(linkId)) throw new WompiError('invalid link id')
  await wompiFetch<unknown>(config, `/EnlacePago/${linkId}/desactivar`, { method: 'PUT' })
}

/* ------------------------------------------------------------------ */
/* Aplicativo — para comprobar las credenciales antes de cobrar        */
/* ------------------------------------------------------------------ */

export type WompiApplication = {
  id: string | null
  name: string | null
  url: string | null
  /** false = todo lo que se cobre con este aplicativo será de prueba. */
  isProduction: boolean
}

/**
 * Datos del aplicativo con el que se autentica la app. Nunca devuelve el
 * `clientSecret` que también trae la respuesta de Wompi.
 */
export async function getApplication(config: WompiConfig): Promise<WompiApplication> {
  const payload = await wompiFetch<{
    idAplicativo?: string
    nombre?: string
    urlAplicativo?: string
    estaProductivo?: boolean
  }>(config, '/Aplicativo')
  return {
    id: payload.idAplicativo ?? null,
    name: payload.nombre ?? null,
    url: payload.urlAplicativo ?? null,
    isProduction: payload.estaProductivo === true,
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
