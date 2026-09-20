import type { PayPalConfig } from './config'

/**
 * Cliente de la API REST de PayPal (Orders v2). SOLO SERVIDOR.
 *
 * Documentación oficial:
 *   https://developer.paypal.com/docs/api/orders/v2/
 *
 * FLUJO (el mismo patrón de redirección que ya usa Wompi, así que encaja
 * con la página de retorno y con lib/payments/process.ts sin inventar
 * nada nuevo):
 *
 *   1. createOrder   POST /v2/checkout/orders   → devuelve un enlace de
 *                    aprobación al que se manda al comprador.
 *   2. El comprador aprueba en paypal.com y vuelve a `return_url`.
 *   3. captureOrder  POST /v2/checkout/orders/{id}/capture → AQUÍ se
 *                    cobra de verdad. Hasta este punto no hay dinero.
 *
 * El paso 3 es la razón de que la aprobación no baste: volver de PayPal
 * solo significa que el comprador pulsó el botón. La reserva se marca
 * pagada con lo que responde la captura, nunca con lo que trae la URL.
 *
 * NINGUNA credencial sale del servidor: el navegador solo ve el enlace de
 * aprobación de paypal.com.
 */

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** `name` o `issue` que devuelve PayPal; sirve para decidir qué hacer. */
    readonly issue?: string,
  ) {
    super(message)
  }
}

/* ------------------------------------------------------------------ */
/* Autenticación                                                       */
/* ------------------------------------------------------------------ */

type Token = { value: string; expiresAt: number }

/**
 * Los tokens duran horas. Se guarda el vigente en memoria del proceso
 * para no pedir uno en cada llamada; si el proceso muere (funciones sin
 * estado), simplemente se vuelve a pedir.
 */
let cached: Token | null = null

async function accessToken(config: PayPalConfig): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new PayPalError(`No se pudo obtener el token de PayPal (${response.status})`, response.status)
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!payload.access_token) throw new PayPalError('PayPal no devolvió token de acceso')

  cached = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  }
  return cached.value
}

/** Solo para las pruebas: olvida el token guardado. */
export function resetPayPalToken() {
  cached = null
}

/* ------------------------------------------------------------------ */
/* Llamadas                                                            */
/* ------------------------------------------------------------------ */

async function call<T>(
  config: PayPalConfig,
  path: string,
  init: { method: string; body?: unknown; requestId?: string },
): Promise<T> {
  const token = await accessToken(config)

  const response = await fetch(`${config.apiBase}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Idempotencia de PayPal. Repetir la misma llamada con la misma
      // llave devuelve el resultado original en vez de cobrar dos veces.
      ...(init.requestId ? { 'PayPal-Request-Id': init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  })

  const text = await response.text()
  let payload: unknown = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    // Respuesta no-JSON: se trata como error con el texto crudo.
  }

  if (!response.ok) {
    const detail = payload as { name?: string; message?: string; details?: Array<{ issue?: string }> } | null
    throw new PayPalError(
      detail?.message ?? `PayPal respondió ${response.status}`,
      response.status,
      detail?.details?.[0]?.issue ?? detail?.name,
    )
  }

  return payload as T
}

/** Centavos enteros → "12.34", que es lo que espera PayPal. */
export function toAmountValue(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** "12.34" → 1234. Se usa para comparar con el importe del servidor. */
export function toCents(value: string): number {
  return Math.round(Number.parseFloat(value) * 100)
}

/* ------------------------------------------------------------------ */
/* Crear orden                                                         */
/* ------------------------------------------------------------------ */

export type CreateOrderInput = {
  /** Nuestra referencia del pago. Viaja como custom_id e invoice_id. */
  reference: string
  amountCents: number
  currency: string
  description: string
  brandName: string
  locale: 'ES' | 'EN'
  returnUrl: string
  cancelUrl: string
}

export type CreatedOrder = {
  orderId: string
  /** Enlace de paypal.com al que hay que enviar al comprador. */
  approveUrl: string
}

type OrderResponse = {
  id?: string
  status?: string
  links?: Array<{ rel?: string; href?: string }>
}

export async function createOrder(config: PayPalConfig, input: CreateOrderInput): Promise<CreatedOrder> {
  const order = await call<OrderResponse>(config, '/v2/checkout/orders', {
    method: 'POST',
    requestId: input.reference,
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.reference,
          // custom_id nos devuelve la referencia en la captura y en los
          // avisos, sin depender de la URL de retorno.
          custom_id: input.reference,
          // invoice_id es único por cuenta de comercio: PayPal rechaza un
          // segundo cobro con el mismo. Es una defensa extra contra pagar
          // dos veces la misma reserva.
          invoice_id: input.reference,
          description: input.description.slice(0, 127),
          amount: {
            currency_code: input.currency,
            value: toAmountValue(input.amountCents),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: input.brandName.slice(0, 127),
            locale: input.locale === 'ES' ? 'es-SV' : 'en-US',
            landing_page: 'LOGIN',
            // No se envía nada físico: PayPal no debe pedir dirección.
            shipping_preference: 'NO_SHIPPING',
            // El importe final ya se conoce: el botón dice «Pagar ahora».
            user_action: 'PAY_NOW',
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    },
  })

  if (!order.id) throw new PayPalError('PayPal no devolvió el identificador de la orden')

  // Con `payment_source` PayPal devuelve el enlace como «payer-action»;
  // sin él, como «approve». Se aceptan los dos por si cambia el flujo.
  const link = order.links?.find((item) => item.rel === 'payer-action' || item.rel === 'approve')
  if (!link?.href) throw new PayPalError('PayPal no devolvió enlace de aprobación')

  return { orderId: order.id, approveUrl: link.href }
}

/* ------------------------------------------------------------------ */
/* Capturar                                                            */
/* ------------------------------------------------------------------ */

export type CaptureResult =
  | {
      outcome: 'completed'
      captureId: string
      amountCents: number
      currency: string
    }
  | { outcome: 'pending'; captureId: string | null; reason: string }
  | { outcome: 'declined'; reason: string }

type CaptureResponse = {
  id?: string
  status?: string
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string
        status?: string
        status_details?: { reason?: string }
        amount?: { currency_code?: string; value?: string }
      }>
    }
  }>
}

/**
 * Cobra una orden aprobada.
 *
 * `requestId` hace la llamada idempotente en PayPal: si la página de
 * retorno se recarga, no se cobra dos veces.
 *
 * Solo `completed` significa dinero cobrado. `pending` es el caso real de
 * una captura retenida por revisión: ni se confirma la reserva ni se
 * rechaza.
 */
export async function captureOrder(
  config: PayPalConfig,
  orderId: string,
  requestId: string,
): Promise<CaptureResult> {
  let response: CaptureResponse
  try {
    response = await call<CaptureResponse>(config, `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      requestId,
      body: {},
    })
  } catch (error) {
    if (error instanceof PayPalError && error.issue) {
      // El comprador no llegó a aprobar, o la orden ya no sirve.
      const rechazables = [
        'ORDER_NOT_APPROVED',
        'PAYER_ACTION_REQUIRED',
        'INSTRUMENT_DECLINED',
        'PAYER_CANNOT_PAY',
        'ORDER_ALREADY_CAPTURED',
        'INVALID_RESOURCE_ID',
      ]
      if (rechazables.includes(error.issue)) {
        // ORDER_ALREADY_CAPTURED se resuelve consultando la orden: puede
        // ser un reintento de una captura que sí salió bien.
        if (error.issue === 'ORDER_ALREADY_CAPTURED') return readCapturedOrder(config, orderId)
        return { outcome: 'declined', reason: error.issue }
      }
    }
    throw error
  }

  return interpret(response)
}

/** Lee una orden ya capturada para recuperar el resultado real. */
async function readCapturedOrder(config: PayPalConfig, orderId: string): Promise<CaptureResult> {
  const order = await call<CaptureResponse>(config, `/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
  })
  return interpret(order)
}

function interpret(response: CaptureResponse): CaptureResult {
  const capture = response.purchase_units?.[0]?.payments?.captures?.[0]

  if (!capture?.id) {
    return { outcome: 'declined', reason: response.status ?? 'noCapture' }
  }

  if (capture.status === 'COMPLETED') {
    const value = capture.amount?.value
    if (!value) return { outcome: 'declined', reason: 'noAmount' }
    return {
      outcome: 'completed',
      captureId: capture.id,
      amountCents: toCents(value),
      currency: capture.amount?.currency_code ?? 'USD',
    }
  }

  if (capture.status === 'PENDING') {
    return {
      outcome: 'pending',
      captureId: capture.id,
      reason: capture.status_details?.reason ?? 'pending',
    }
  }

  return { outcome: 'declined', reason: capture.status ?? 'unknown' }
}
