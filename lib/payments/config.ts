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
