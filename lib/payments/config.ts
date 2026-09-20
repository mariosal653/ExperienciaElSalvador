/**
 * Configuración de pagos. SOLO SERVIDOR: lee secretos.
 *
 * WOMPI_ENVIRONMENT
 *   mock        Pasarela simulada dentro de la app. No cobra nada. Sirve
 *               para desarrollar y hacer demos sin credenciales. Las
 *               reservas quedan marcadas como de prueba.
 *   sandbox     Wompi real con un negocio en MODO DE PRUEBAS (se activa en
 *               el panel de Wompi, no con otra URL). No cobra. Se aceptan
 *               transacciones con `esReal: false`.
 *   production  Wompi real, cobro real. Se RECHAZA cualquier transacción
 *               que Wompi marque como de prueba.
 *
 * Si la variable no está:
 *   - en desarrollo  → mock, para que nada se bloquee.
 *   - en producción  → pagos DESACTIVADOS. Nunca se cae a mock en silencio:
 *                      un sitio publicado que «cobra» sin cobrar es peor que
 *                      uno que dice que los pagos no están disponibles.
 *
 * Correspondencia con el panel de Wompi (Configuración → Integraciones):
 *   WOMPI_PUBLIC_KEY      = App ID      (client_id)
 *   WOMPI_PRIVATE_KEY     = API Secret  (client_secret)
 *   WOMPI_WEBHOOK_SECRET  = clave con la que Wompi firma el webhook. Wompi
 *                           firma con el API Secret del aplicativo, así que
 *                           si no se define se usa WOMPI_PRIVATE_KEY.
 */

export type PaymentMode = 'mock' | 'sandbox' | 'production'

export type PaymentConfig =
  | { status: 'ready'; mode: 'mock' }
  | {
      status: 'ready'
      mode: 'sandbox' | 'production'
      clientId: string
      clientSecret: string
      webhookSecret: string
      apiBase: string
      authUrl: string
    }
  | { status: 'disabled'; reason: 'notConfigured' | 'missingKeys' | 'invalidEnvironment' }

const WOMPI_API = 'https://api.wompi.sv'
const WOMPI_AUTH = 'https://id.wompi.sv/connect/token'

export function getPaymentConfig(): PaymentConfig {
  const raw = process.env.WOMPI_ENVIRONMENT?.trim().toLowerCase()
  const isProduction = process.env.NODE_ENV === 'production'

  const mode: string | undefined = raw || (isProduction ? undefined : 'mock')

  if (!mode) return { status: 'disabled', reason: 'notConfigured' }
  if (mode === 'mock') return { status: 'ready', mode: 'mock' }
  if (mode !== 'sandbox' && mode !== 'production') {
    return { status: 'disabled', reason: 'invalidEnvironment' }
  }

  const clientId = process.env.WOMPI_PUBLIC_KEY?.trim()
  const clientSecret = process.env.WOMPI_PRIVATE_KEY?.trim()
  if (!clientId || !clientSecret) return { status: 'disabled', reason: 'missingKeys' }

  return {
    status: 'ready',
    mode,
    clientId,
    clientSecret,
    webhookSecret: process.env.WOMPI_WEBHOOK_SECRET?.trim() || clientSecret,
    apiBase: process.env.WOMPI_API_URL?.trim() || WOMPI_API,
    authUrl: process.env.WOMPI_AUTH_URL?.trim() || WOMPI_AUTH,
  }
}

/** Lo que puede saber el navegador: el modo, nunca las claves. */
export function publicPaymentInfo(): { enabled: boolean; mode: PaymentMode | null } {
  const config = getPaymentConfig()
  return config.status === 'ready'
    ? { enabled: true, mode: config.mode }
    : { enabled: false, mode: null }
}

/* ==================================================================== */
/* PayPal                                                               */
/* ==================================================================== */

/**
 * PayPal se configura APARTE de Wompi y se añade como opción, no lo
 * sustituye: un comercio puede tener las dos, una o ninguna.
 *
 * PAYPAL_ENVIRONMENT
 *   sandbox     cuentas de prueba de developer.paypal.com. No cobra.
 *   production  cobro real (PayPal lo llama «live»; se acepta ese nombre).
 *
 * Sin PAYPAL_ENVIRONMENT, o sin las dos claves, PayPal simplemente NO
 * aparece como método de pago. No se cae a una simulación: un botón que
 * dice «Pagar con PayPal» y no cobra es peor que no tener el botón.
 *
 * Panel de PayPal → Apps & Credentials:
 *   PAYPAL_CLIENT_ID      = Client ID
 *   PAYPAL_CLIENT_SECRET  = Secret
 *
 * Ninguna lleva NEXT_PUBLIC_: las dos se quedan en el servidor.
 */

const PAYPAL_API_SANDBOX = 'https://api-m.sandbox.paypal.com'
const PAYPAL_API_LIVE = 'https://api-m.paypal.com'

export type PayPalConfig = {
  mode: 'sandbox' | 'production'
  clientId: string
  clientSecret: string
  apiBase: string
}

export type PayPalConfigResult =
  | { status: 'ready'; config: PayPalConfig }
  | { status: 'disabled'; reason: 'notConfigured' | 'missingKeys' | 'invalidEnvironment' }

export function getPayPalConfig(): PayPalConfigResult {
  const raw = process.env.PAYPAL_ENVIRONMENT?.trim().toLowerCase()
  if (!raw) return { status: 'disabled', reason: 'notConfigured' }

  // PayPal llama «live» a producción; se admiten los dos nombres para no
  // obligar a recordar cuál usa este proyecto.
  const mode = raw === 'live' || raw === 'production' ? 'production' : raw === 'sandbox' ? 'sandbox' : null
  if (!mode) return { status: 'disabled', reason: 'invalidEnvironment' }

  const clientId = process.env.PAYPAL_CLIENT_ID?.trim()
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return { status: 'disabled', reason: 'missingKeys' }

  return {
    status: 'ready',
    config: {
      mode,
      clientId,
      clientSecret,
      apiBase:
        process.env.PAYPAL_API_URL?.trim() ||
        (mode === 'production' ? PAYPAL_API_LIVE : PAYPAL_API_SANDBOX),
    },
  }
}

/* ==================================================================== */
/* Métodos disponibles                                                  */
/* ==================================================================== */

export type PaymentMethod = 'wompi' | 'paypal'

/** Qué puede elegir el comprador. El navegador ve esto; nunca las claves. */
export type AvailableMethods = {
  wompi: { available: boolean; mode: PaymentMode | null }
  paypal: { available: boolean; mode: 'sandbox' | 'production' | null }
  /** true si hay al menos una forma de pagar. */
  any: boolean
}

export function availablePaymentMethods(): AvailableMethods {
  const wompi = getPaymentConfig()
  const paypal = getPayPalConfig()

  const wompiInfo = {
    available: wompi.status === 'ready',
    mode: wompi.status === 'ready' ? wompi.mode : null,
  }
  const paypalInfo = {
    available: paypal.status === 'ready',
    mode: paypal.status === 'ready' ? paypal.config.mode : null,
  }

  return { wompi: wompiInfo, paypal: paypalInfo, any: wompiInfo.available || paypalInfo.available }
}
