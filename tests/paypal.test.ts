import { describe, it, expect, afterAll } from 'vitest'
import { getPayPalConfig, availablePaymentMethods } from '../lib/payments/config'
import { toAmountValue, toCents } from '../lib/payments/paypal'

/**
 * Configuración de PayPal y conversión de importes.
 *
 * Lo que se prueba aquí es lo que decide si se cobra y cuánto:
 *   - que PayPal NUNCA se active a medias (sin claves queda desactivado);
 *   - que producción y sandbox apunten a la API correcta;
 *   - que los centavos enteros del servidor y el texto "12.34" que espera
 *     PayPal sean equivalentes en los dos sentidos.
 *
 * El diálogo con la API (crear orden, capturar) no se prueba aquí: haría
 * falta un doble de la API de PayPal. Lo que sí está cubierto, en
 * payments.test.ts, es la parte que protege el dinero —importe que no
 * coincide, transacción repetida, aprobación idempotente—, porque
 * `approvePayment` es común a las dos pasarelas.
 */

const saved = { ...process.env }
const env = process.env as Record<string, string | undefined>

afterAll(() => {
  process.env = saved
})

function limpiar() {
  delete env.PAYPAL_ENVIRONMENT
  delete env.PAYPAL_CLIENT_ID
  delete env.PAYPAL_CLIENT_SECRET
  delete env.PAYPAL_API_URL
}

describe('configuración de PayPal', () => {
  it('sin variables → desactivado', () => {
    limpiar()
    expect(getPayPalConfig()).toEqual({ status: 'disabled', reason: 'notConfigured' })
  })

  it('con entorno pero sin claves → desactivado, nunca a medias', () => {
    limpiar()
    env.PAYPAL_ENVIRONMENT = 'sandbox'
    expect(getPayPalConfig()).toEqual({ status: 'disabled', reason: 'missingKeys' })
  })

  it('entorno inválido → desactivado', () => {
    limpiar()
    env.PAYPAL_ENVIRONMENT = 'pruebas'
    env.PAYPAL_CLIENT_ID = 'id'
    env.PAYPAL_CLIENT_SECRET = 'secret'
    expect(getPayPalConfig()).toEqual({ status: 'disabled', reason: 'invalidEnvironment' })
  })

  it('sandbox apunta a la API de sandbox', () => {
    limpiar()
    env.PAYPAL_ENVIRONMENT = 'sandbox'
    env.PAYPAL_CLIENT_ID = 'id'
    env.PAYPAL_CLIENT_SECRET = 'secret'
    expect(getPayPalConfig()).toEqual({
      status: 'ready',
      config: {
        mode: 'sandbox',
        clientId: 'id',
        clientSecret: 'secret',
        apiBase: 'https://api-m.sandbox.paypal.com',
      },
    })
  })

  it('"live" y "production" significan lo mismo y apuntan a la API real', () => {
    limpiar()
    env.PAYPAL_CLIENT_ID = 'id'
    env.PAYPAL_CLIENT_SECRET = 'secret'

    for (const valor of ['live', 'production', 'PRODUCTION']) {
      env.PAYPAL_ENVIRONMENT = valor
      const result = getPayPalConfig()
      expect(result.status).toBe('ready')
      if (result.status !== 'ready') throw new Error('inalcanzable')
      expect(result.config.mode).toBe('production')
      expect(result.config.apiBase).toBe('https://api-m.paypal.com')
    }
  })
})

describe('métodos de pago disponibles', () => {
  it('sin ninguna pasarela configurada en producción no se puede cobrar', () => {
    limpiar()
    delete env.WOMPI_ENVIRONMENT
    env.NODE_ENV = 'production'

    const methods = availablePaymentMethods()
    expect(methods.any).toBe(false)
    expect(methods.paypal.available).toBe(false)
    expect(methods.wompi.available).toBe(false)

    env.NODE_ENV = 'test'
  })

  it('PayPal puede estar disponible aunque Wompi no lo esté', () => {
    limpiar()
    delete env.WOMPI_ENVIRONMENT
    env.NODE_ENV = 'production'
    env.PAYPAL_ENVIRONMENT = 'sandbox'
    env.PAYPAL_CLIENT_ID = 'id'
    env.PAYPAL_CLIENT_SECRET = 'secret'

    const methods = availablePaymentMethods()
    expect(methods.wompi.available).toBe(false)
    expect(methods.paypal).toEqual({ available: true, mode: 'sandbox' })
    expect(methods.any).toBe(true)

    env.NODE_ENV = 'test'
    limpiar()
  })
})

describe('importes', () => {
  it('centavos → el texto que espera PayPal, siempre con dos decimales', () => {
    expect(toAmountValue(1234)).toBe('12.34')
    expect(toAmountValue(1200)).toBe('12.00')
    expect(toAmountValue(5)).toBe('0.05')
    expect(toAmountValue(0)).toBe('0.00')
  })

  it('el texto de PayPal vuelve a los mismos centavos enteros', () => {
    for (const cents of [0, 5, 99, 1234, 1200, 99_999, 123_456]) {
      expect(toCents(toAmountValue(cents))).toBe(cents)
    }
  })

  it('no se pierde un centavo por coma flotante', () => {
    // 0.1 + 0.2 en coma flotante da 0.30000000000000004: el redondeo del
    // conversor es lo que impide que un importe así llegue mal.
    expect(toCents('0.30')).toBe(30)
    expect(toCents('1234.56')).toBe(123_456)
  })
})
